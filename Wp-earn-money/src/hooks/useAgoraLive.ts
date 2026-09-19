'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteVideoTrack,
  type IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '@/lib/store';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

export interface UseAgoraLiveReturn {
  startBroadcasting: (title: string, channelName: string) => Promise<{ channelName: string; streamId: string } | null>;
  stopBroadcasting: () => Promise<void>;
  watchStream: (streamId: string, channelName: string) => Promise<void>;
  leaveStream: () => void;
  setMicEnabled: (enabled: boolean) => void;
  setCameraEnabled: (enabled: boolean) => void;
  switchCamera: () => Promise<void>;
  localVideoTrack: ICameraVideoTrack | null;
  remoteVideoTrack: IRemoteVideoTrack | null;
  isBroadcasting: boolean;
  isWatching: boolean;
  error: string | null;
  currentStreamId: string | null;
  channelName: string | null;
}

export function useAgoraLive(): UseAgoraLiveReturn {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<IRemoteVideoTrack | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);

  // Cleanup all resources (stop tracks, leave client)
  const cleanupClient = useCallback(() => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.close().catch(() => {});
      localVideoTrackRef.current = null;
    }
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.close().catch(() => {});
      localAudioTrackRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.leave().catch(() => {});
      clientRef.current = null;
    }
    setLocalVideoTrack(null);
    setRemoteVideoTrack(null);
  }, []);

  // Start broadcasting as host (publisher)
  const startBroadcasting = useCallback(async (title: string, chName: string) => {
    try {
      cleanupClient();
      setError(null);

      if (!APP_ID) {
        setError('Agora APP_ID is not configured.');
        return null;
      }

      const user = useAuthStore.getState().user;

      // Create Firestore document first
      const liveStreamsRef = collection(db, 'liveStreams');
      const docRef = await addDoc(liveStreamsRef, {
        hostId: user?.uid || 'anonymous',
        hostName: user?.displayName || 'Anonymous',
        hostPhoto: user?.photoURL || null,
        channelName: chName,
        title,
        status: 'active',
        viewerCount: 0,
        startedAt: serverTimestamp(),
      });

      const streamId = docRef.id;
      setCurrentStreamId(streamId);
      setChannelName(chName);

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      const uid = user?.uid || Math.floor(Math.random() * 1000000).toString();

      // Fetch publisher token
      const tokenRes = await fetch('/api/agora-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: chName, uid, role: 'publisher' }),
      });

      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({ error: 'Token fetch failed' }));
        throw new Error(errData.error || 'Failed to get token');
      }

      const { token } = await tokenRes.json();

      // Join channel as publisher
      await client.join(APP_ID, chName, token, uid);

      // Create and publish tracks
      const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioTrackRef.current = microphoneTrack;
      localVideoTrackRef.current = cameraTrack;
      setLocalVideoTrack(cameraTrack);

      await client.publish([microphoneTrack, cameraTrack]);
      setIsBroadcasting(true);

      // Handle client errors
      client.on('error', (err) => {
        console.error('[useAgoraLive] Broadcasting error:', err);
        setError(`Broadcast error: ${err.reason || 'Unknown'}`);
      });

      return { channelName: chName, streamId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start broadcast';
      setError(message);
      cleanupClient();
      setIsBroadcasting(false);
      setCurrentStreamId(null);
      return null;
    }
  }, [cleanupClient]);

  // Stop broadcasting
  const stopBroadcasting = useCallback(async () => {
    try {
      // Update Firestore document
      if (currentStreamId) {
        const streamDocRef = doc(db, 'liveStreams', currentStreamId);
        await updateDoc(streamDocRef, {
          status: 'ended',
          endedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('[useAgoraLive] Error updating Firestore:', err);
    } finally {
      cleanupClient();
      setIsBroadcasting(false);
      setCurrentStreamId(null);
      setChannelName(null);
      setError(null);
    }
  }, [currentStreamId, cleanupClient]);

  // Watch a stream as subscriber (audience)
  const watchStream = useCallback(async (streamId: string, chName: string) => {
    try {
      cleanupClient();
      setError(null);

      if (!APP_ID) {
        setError('Agora APP_ID is not configured.');
        return;
      }

      setCurrentStreamId(streamId);
      setChannelName(chName);

      // Create client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      const user = useAuthStore.getState().user;
      const uid = user?.uid || Math.floor(Math.random() * 1000000).toString();

      // Fetch subscriber token
      const tokenRes = await fetch('/api/agora-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: chName, uid, role: 'subscriber' }),
      });

      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({ error: 'Token fetch failed' }));
        throw new Error(errData.error || 'Failed to get viewer token');
      }

      const { token } = await tokenRes.json();

      // Join as subscriber (audience mode)
      await client.join(APP_ID, chName, token, uid);
      setIsWatching(true);

      // Subscribe to remote user's video
      client.on('user-published', async (remoteUser: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
        try {
          await client.subscribe(remoteUser, mediaType);

          if (mediaType === 'video') {
            const track = remoteUser.videoTrack as IRemoteVideoTrack;
            if (track) {
              setRemoteVideoTrack(track);
            }
          }

          if (mediaType === 'audio' && remoteUser.audioTrack) {
            remoteUser.audioTrack.play();
          }
        } catch (subscribeErr) {
          console.error('[useAgoraLive] Error subscribing to stream:', subscribeErr);
        }
      });

      client.on('user-unpublished', (remoteUser: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
        if (mediaType === 'video') {
          setRemoteVideoTrack(null);
        }
      });

      client.on('user-left', () => {
        setRemoteVideoTrack(null);
      });

      client.on('error', (err) => {
        console.error('[useAgoraLive] Viewing error:', err);
        setError(`Stream error: ${err.reason || 'Unknown'}`);
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to watch stream';
      setError(message);
      cleanupClient();
      setIsWatching(false);
      setCurrentStreamId(null);
      setChannelName(null);
    }
  }, [cleanupClient]);

  // Toggle local mic on/off (host only — no-op if not broadcasting)
  const setMicEnabled = useCallback((enabled: boolean) => {
    localAudioTrackRef.current?.setEnabled(enabled).catch(() => {});
  }, []);

  // Toggle local camera on/off (host only — no-op if not broadcasting)
  const setCameraEnabled = useCallback((enabled: boolean) => {
    localVideoTrackRef.current?.setEnabled(enabled).catch(() => {});
  }, []);

  // Switch between front/back camera on mobile (host only).
  const switchCamera = useCallback(async () => {
    const track = localVideoTrackRef.current;
    if (!track) return;
    try {
      const cameras = await AgoraRTC.getCameras();
      if (cameras.length < 2) return; // only one camera available — nothing to switch to
      const currentLabel = track.getTrackLabel?.() || '';
      const nextCamera = cameras.find((c) => c.label !== currentLabel) || cameras[1];
      await track.setDevice(nextCamera.deviceId);
    } catch {
      // Some devices/browsers don't support switching mid-stream — fail silently
      // rather than crashing the live view.
    }
  }, []);

  // Leave the stream
  const leaveStream = useCallback(() => {
    cleanupClient();
    setIsWatching(false);
    setCurrentStreamId(null);
    setChannelName(null);
    setError(null);
  }, [cleanupClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupClient();
      setIsBroadcasting(false);
      setIsWatching(false);
    };
  }, []);

  return {
    startBroadcasting,
    stopBroadcasting,
    watchStream,
    leaveStream,
    setMicEnabled,
    setCameraEnabled,
    switchCamera,
    localVideoTrack,
    remoteVideoTrack,
    isBroadcasting,
    isWatching,
    error,
    currentStreamId,
    channelName,
  };
}
