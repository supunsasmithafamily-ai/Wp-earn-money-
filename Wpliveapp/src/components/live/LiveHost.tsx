'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveStore, useWalletStore } from '@/lib/store';
import { GiftAnimation } from '@/components/three/GiftAnimation';
import { GlassmorphismCard } from '@/components/three/GlassmorphismCard';
import { CoinIcon } from '@/components/three/CoinIcon';
import {
  X,
  Send,
  Gift,
  Share2,
  Eye,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from 'lucide-react';

interface LiveHostProps {
  channelName: string;
  onClose: () => void;
}

const mockChatMessages = [
  { user: 'CryptoFan', text: 'Great stream! 🔥', color: '#FF6B6B' },
  { user: 'Sarah', text: 'Love the energy! ❤️', color: '#4ECDC4' },
  { user: 'Mike', text: 'Just sent 100 coins! 🪙', color: '#45B7D1' },
  { user: 'Emma', text: 'How do I go live?', color: '#96CEB4' },
  { user: 'Alex', text: 'This is amazing content!', color: '#FFEAA7' },
  { user: 'Luna', text: 'Can you play some music? 🎵', color: '#DDA0DD' },
  { user: 'Dave', text: 'First time here, love it! 🎉', color: '#82E0AA' },
  { user: 'Jenny', text: 'Sending gifts! 💎', color: '#F1948A' },
  { user: 'Tom', text: 'What wallet do you recommend?', color: '#AED6F1' },
  { user: 'CryptoKing', text: 'LFG!!! 🚀🚀🚀', color: '#F9E79F' },
];

const giftOptions = [
  { id: 'rose', emoji: '🌹', name: 'Rose', cost: 10 },
  { id: 'giftbox', emoji: '🎁', name: 'Gift Box', cost: 50 },
  { id: 'diamond', emoji: '💎', name: 'Diamond', cost: 100 },
  { id: 'crown', emoji: '👑', name: 'Crown', cost: 500 },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', cost: 1000 },
  { id: 'trophy', emoji: '🏆', name: 'Trophy', cost: 5000 },
];

export function LiveHost({ channelName, onClose }: LiveHostProps) {
  const {
    viewerCount,
    setViewerCount,
    addLiveGift,
    addLiveMessage,
    liveMessages,
    liveGifts,
    clearLiveState,
  } = useLiveStore();
  const { coinBalance, setCoinBalance, addTransaction } = useWalletStore();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [selectedGift, setSelectedGift] = useState<typeof giftOptions[0] | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Timer for stream duration
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate viewer count changes
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setViewerCount(
        Math.max(50, Math.floor(150 + Math.random() * 100 - 50 + viewerCount))
      );
    }, 5000);
    return () => clearInterval(viewerInterval);
  }, [setViewerCount, viewerCount]);

  // Auto-generate chat messages
  useEffect(() => {
    const chatInterval = setInterval(() => {
      const randomMsg = mockChatMessages[Math.floor(Math.random() * mockChatMessages.length)];
      addLiveMessage({
        id: `msg_${Date.now()}_${Math.random()}`,
        ...randomMsg,
        timestamp: Date.now(),
      });
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(chatInterval);
  }, [addLiveMessage]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveMessages]);

  // Simulate incoming gifts from viewers
  useEffect(() => {
    const giftInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        const randomGift = giftOptions[Math.floor(Math.random() * giftOptions.length)];
        const viewers = ['CryptoFan', 'Sarah', 'Mike', 'Alex', 'Luna', 'Dave', 'Jenny'];
        const sender = viewers[Math.floor(Math.random() * viewers.length)];
        addLiveGift({
          id: `gift_${Date.now()}`,
          emoji: randomGift.emoji,
          name: randomGift.name,
          sender,
          timestamp: Date.now(),
          cost: randomGift.cost,
        });
      }
    }, 8000);
    return () => clearInterval(giftInterval);
  }, [addLiveGift]);

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    addLiveMessage({
      id: `msg_host_${Date.now()}`,
      user: 'You (Host)',
      text: chatInput.trim(),
      color: '#25D366',
      timestamp: Date.now(),
    });
    setChatInput('');
  }, [chatInput, addLiveMessage]);

  const handleSendGift = useCallback(
    (gift: typeof giftOptions[0]) => {
      if (coinBalance < gift.cost) {
        return;
      }
      setCoinBalance(coinBalance - gift.cost);
      addTransaction({
        id: `tx_${Date.now()}`,
        type: 'gift_sent',
        amount: -gift.cost,
        description: `Sent ${gift.emoji} ${gift.name} to yourself`,
        timestamp: Date.now(),
      });
      addLiveGift({
        id: `gift_self_${Date.now()}`,
        emoji: gift.emoji,
        name: gift.name,
        sender: 'You',
        timestamp: Date.now(),
        cost: gift.cost,
      });
      setSelectedGift(null);
      setShowGiftPanel(false);
    },
    [coinBalance, setCoinBalance, addTransaction, addLiveGift]
  );

  const handleEndStream = useCallback(() => {
    clearLiveState();
    onClose();
  }, [clearLiveState, onClose]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111B21] flex flex-col">
      {/* Video / Camera Area */}
      <div className="relative flex-1 min-h-0">
        {/* Gradient placeholder for camera feed */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#1F2C34]">
          {/* Animated camera feed simulation */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-40 h-40 rounded-full bg-[#25D366]/10"
              animate={{
                x: [0, 100, -50, 0],
                y: [0, -80, 50, 0],
                scale: [1, 1.2, 0.9, 1],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-60 h-60 rounded-full bg-[#075E54]/30 -top-10 -right-10"
              animate={{
                x: [0, -80, 50, 0],
                y: [0, 50, -80, 0],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Camera off overlay */}
          {!isCameraOn && (
            <div className="absolute inset-0 bg-[#111B21] flex items-center justify-center">
              <CameraOff className="w-16 h-16 text-gray-600" />
            </div>
          )}

          {/* "Your Camera" text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="flex flex-col items-center gap-2 opacity-30"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Camera className="w-12 h-12 text-white" />
              <span className="text-xs text-white/60">Camera Preview</span>
            </motion.div>
          </div>
        </div>

        {/* Gift Animations */}
        <GiftAnimation gifts={liveGifts} position="left" />

        {/* Top Bar */}
        <div className="absolute top-0 inset-x-0 z-30">
          <div className="bg-gradient-to-b from-black/60 via-black/30 to-transparent px-4 pt-3 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* LIVE badge */}
                <motion.div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-white"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <span className="text-xs font-bold text-white">LIVE</span>
                </motion.div>
                {/* Timer */}
                <span className="text-xs font-mono text-white/80 bg-black/40 px-2 py-0.5 rounded">
                  {formatTime(elapsedTime)}
                </span>
                {/* Viewers */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40">
                  <Eye className="w-3 h-3 text-white" />
                  <motion.span
                    key={viewerCount}
                    className="text-xs text-white font-medium"
                    initial={{ y: -5 }}
                    animate={{ y: 0 }}
                  >
                    {viewerCount}
                  </motion.span>
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2">
                <CoinIcon balance={coinBalance} size="sm" />
                <motion.button
                  onClick={() => setShowEndConfirm(true)}
                  className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <PhoneOff className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div
            ref={chatContainerRef}
            className="px-3 pb-2 max-h-56 overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#2A3942 transparent' }}
          >
            {liveMessages.slice(-20).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-1.5"
              >
                <div className="inline-block max-w-[80%] px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md">
                  <span className="text-xs font-bold" style={{ color: msg.color || '#fff' }}>
                    {msg.user}
                  </span>
                  <span className="text-xs text-white/90 ml-1.5">{msg.text}</span>
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Gift Panel */}
      <AnimatePresence>
        {showGiftPanel && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-24 left-0 right-0 z-40 px-3"
          >
            <GlassmorphismCard variant="dark" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">Send a Gift</span>
                <CoinIcon balance={coinBalance} size="sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {giftOptions.map((gift) => (
                  <motion.button
                    key={gift.id}
                    onClick={() => {
                      if (coinBalance >= gift.cost) {
                        setSelectedGift(gift);
                      }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={coinBalance < gift.cost}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                      selectedGift?.id === gift.id
                        ? 'bg-[#25D366]/20 border-[#25D366]'
                        : 'bg-[#1F2C34]/80 border-[#2A3942] hover:border-[#25D366]/50'
                    } ${coinBalance < gift.cost ? 'opacity-40' : ''}`}
                  >
                    <span className="text-2xl">{gift.emoji}</span>
                    <span className="text-[10px] text-gray-300 font-medium">{gift.name}</span>
                    <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                      🪙 {gift.cost.toLocaleString()}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Send gift button */}
              <AnimatePresence>
                {selectedGift && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={() => handleSendGift(selectedGift)}
                    className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold text-sm flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Gift className="w-4 h-4" />
                    Send {selectedGift.emoji} {selectedGift.name} ({selectedGift.cost} 🪙)
                  </motion.button>
                )}
              </AnimatePresence>
            </GlassmorphismCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Action Bar */}
      <div className="relative z-30 bg-[#1F2C34]/95 backdrop-blur-xl border-t border-[#2A3942]/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Chat Input */}
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-[#111B21] border border-[#2A3942]">
            <MessageCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Say something..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            {chatInput && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleSendChat}
                className="p-0.5"
              >
                <Send className="w-4 h-4 text-[#25D366]" />
              </motion.button>
            )}
          </div>

          {/* Mic toggle */}
          <motion.button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isMicOn ? 'bg-[#2A3942]' : 'bg-red-600'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            {isMicOn ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
          </motion.button>

          {/* Camera toggle */}
          <motion.button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isCameraOn ? 'bg-[#2A3942]' : 'bg-red-600'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            {isCameraOn ? <Camera className="w-4 h-4 text-white" /> : <CameraOff className="w-4 h-4 text-white" />}
          </motion.button>

          {/* Gift button */}
          <motion.button
            onClick={() => setShowGiftPanel(!showGiftPanel)}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              showGiftPanel ? 'bg-yellow-500' : 'bg-[#2A3942]'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            <Gift className="w-4 h-4 text-white" />
          </motion.button>

          {/* Share */}
          <motion.button
            className="w-9 h-9 rounded-full bg-[#2A3942] flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <Share2 className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>

      {/* End Stream Confirmation */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <GlassmorphismCard variant="dark" className="p-6 w-72 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-600/20 flex items-center justify-center">
                  <PhoneOff className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">End Stream?</h3>
                <p className="text-sm text-gray-400 mb-1">
                  Duration: {formatTime(elapsedTime)}
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Peak viewers: {Math.max(viewerCount, 200)}
                </p>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#2A3942] text-white text-sm font-medium"
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleEndStream}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium"
                    whileTap={{ scale: 0.95 }}
                  >
                    End Stream
                  </motion.button>
                </div>
              </GlassmorphismCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
