'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveStore, useWalletStore } from '@/lib/store';
import { LiveButton3D } from '@/components/three/LiveButton3D';
import { GlassmorphismCard } from '@/components/three/GlassmorphismCard';
import { CoinIcon } from '@/components/three/CoinIcon';
import { LiveHost } from '@/components/live/LiveHost';
import { LiveAudience } from '@/components/live/LiveAudience';
import {
  Eye,
  TrendingUp,
  Users,
  Clock,
  Zap,
  ChevronRight,
  Flame,
  Star,
  Calendar,
  Bell,
} from 'lucide-react';

const mockLiveStreams = [
  { id: 's1', host: 'Sarah Johnson', title: 'Crypto Trading Tips 📈', viewers: 1243, thumbnail: 'from-purple-500 to-pink-500' },
  { id: 's2', host: 'TechBro Alex', title: 'Coding Live Session', viewers: 856, thumbnail: 'from-blue-500 to-cyan-500' },
  { id: 's3', host: 'Luna Star', title: 'Music & Chat 🎵', viewers: 2341, thumbnail: 'from-orange-500 to-red-500' },
  { id: 's4', host: 'NFT Queen', title: 'NFT Art Creation', viewers: 567, thumbnail: 'from-green-500 to-teal-500' },
  { id: 's5', host: 'David Chen', title: 'Gaming - Fortnite', viewers: 3102, thumbnail: 'from-red-500 to-yellow-500' },
  { id: 's6', host: 'Emma Wilson', title: 'Cooking & Chat', viewers: 423, thumbnail: 'from-yellow-500 to-orange-500' },
];

const categories = [
  { id: 'gaming', label: 'Gaming', emoji: '🎮', color: 'from-red-500 to-orange-500' },
  { id: 'music', label: 'Music', emoji: '🎵', color: 'from-purple-500 to-pink-500' },
  { id: 'chat', label: 'Chat', emoji: '💬', color: 'from-blue-500 to-cyan-500' },
  { id: 'crypto', label: 'Crypto', emoji: '🪙', color: 'from-yellow-500 to-amber-500' },
  { id: 'creative', label: 'Creative', emoji: '🎨', color: 'from-green-500 to-teal-500' },
];

const upcomingStreams = [
  { id: 'u1', host: 'Master Trader', title: 'BTC Analysis Live', scheduledAt: 'Today, 8:00 PM', thumbnail: 'from-indigo-500 to-purple-600', followers: '12.5K' },
  { id: 'u2', host: 'ArtistPro', title: 'Digital Art Workshop', scheduledAt: 'Tomorrow, 3:00 PM', thumbnail: 'from-pink-500 to-rose-600', followers: '8.2K' },
  { id: 'u3', host: 'CryptoKing', title: 'DeFi Deep Dive', scheduledAt: 'Wed, 7:30 PM', thumbnail: 'from-emerald-500 to-green-600', followers: '25.1K' },
];

export default function LiveHome() {
  const { setViewing, setHosting } = useLiveStore();
  const { coinBalance } = useWalletStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewingStream, setViewingStream] = useState<typeof mockLiveStreams[0] | null>(null);
  const [hostingStream, setHostingStream] = useState(false);

  const handleGoLive = useCallback(() => {
    setHostingStream(true);
    setHosting(true, `channel_${Date.now()}`);
  }, [setHosting]);

  const handleJoinStream = useCallback(
    (stream: typeof mockLiveStreams[0]) => {
      setViewingStream(stream);
      setViewing(true, stream.id);
    },
    [setViewing]
  );

  const handleCloseAudience = useCallback(() => {
    setViewingStream(null);
    useLiveStore.getState().clearLiveState();
  }, []);

  const handleCloseHost = useCallback(() => {
    setHostingStream(false);
    useLiveStore.getState().clearLiveState();
  }, []);

  const filteredStreams = selectedCategory
    ? mockLiveStreams.filter((s) => {
        const catMap: Record<string, string[]> = {
          gaming: ['s5'],
          music: ['s3'],
          chat: ['s6'],
          crypto: ['s1'],
          creative: ['s4'],
        };
        return catMap[selectedCategory]?.includes(s.id) || mockLiveStreams.length > 0;
      })
    : mockLiveStreams;

  return (
    <div className="min-h-screen bg-[#111B21] text-white">
      {/* If viewing a stream as audience */}
      <AnimatePresence>
        {viewingStream && (
          <motion.div
            key="audience-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <LiveAudienceInline
              channelName={viewingStream.id}
              streamTitle={viewingStream.title}
              hostName={viewingStream.host}
              onClose={handleCloseAudience}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* If hosting */}
      <AnimatePresence>
        {hostingStream && (
          <motion.div
            key="host-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <LiveHostInline
              channelName={`channel_${Date.now()}`}
              onClose={handleCloseHost}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#111B21]/95 backdrop-blur-xl border-b border-[#2A3942]/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-[#25D366]"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#25D366] to-[#128C7E] bg-clip-text text-transparent">
              Live
            </h1>
          </div>
          <CoinIcon balance={coinBalance} size="sm" />
        </div>
      </div>

      <div className="px-4 pb-24 space-y-6">
        {/* Go Live Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-6"
        >
          <GlassmorphismCard className="p-6" glow glowColor="rgba(37, 211, 102, 0.15)">
            <div className="flex flex-col items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-center mb-1">Start Broadcasting</h2>
                <p className="text-sm text-gray-400 text-center">Share your talent with the world</p>
              </div>
              <LiveButton3D onClick={handleGoLive} size="lg" />
              <motion.button
                onClick={handleGoLive}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold text-sm shadow-lg shadow-[#25D366]/20"
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(37, 211, 102, 0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Go Live Now
                </span>
              </motion.button>
            </div>
          </GlassmorphismCard>
        </motion.section>

        {/* Popular Now */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold">Popular Now</h3>
              <motion.span
                className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                LIVE
              </motion.span>
            </div>
            <button className="text-xs text-[#25D366] flex items-center gap-1">
              See All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {filteredStreams.map((stream, index) => (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="flex-shrink-0 w-44 cursor-pointer"
                onClick={() => handleJoinStream(stream)}
              >
                <GlassmorphismCard className="overflow-hidden group">
                  {/* Thumbnail */}
                  <div className="relative h-56 bg-gradient-to-br ${stream.thumbnail} overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${stream.thumbnail}`} />
                    {/* Animated pattern overlay */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-2 left-2 w-16 h-16 rounded-full border border-white/30 animate-pulse" />
                      <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full border border-white/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </div>
                    {/* Live badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600/90 backdrop-blur-sm">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-white"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-[10px] font-bold text-white">LIVE</span>
                    </div>
                    {/* Viewers */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                      <Eye className="w-3 h-3 text-white" />
                      <span className="text-[10px] text-white font-medium">
                        {stream.viewers >= 1000 ? `${(stream.viewers / 1000).toFixed(1)}K` : stream.viewers}
                      </span>
                    </div>
                    {/* Bottom gradient */}
                    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h4 className="text-sm font-semibold truncate">{stream.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{stream.host}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-600" />
                      <span className="text-[10px] text-gray-500">{stream.host}</span>
                    </div>
                  </div>
                </GlassmorphismCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Categories */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-bold mb-3">Categories</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {categories.map((cat, index) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r ' + cat.color + ' border-transparent text-white shadow-lg'
                    : 'bg-[#1F2C34] border-[#2A3942] text-gray-300 hover:border-[#25D366]/50'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Upcoming Streams */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#128C7E]" />
              <h3 className="text-lg font-bold">Upcoming Streams</h3>
            </div>
            <button className="text-xs text-[#25D366] flex items-center gap-1">
              See All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingStreams.map((stream, index) => (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <GlassmorphismCard className="p-3 flex gap-3">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${stream.thumbnail}`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white/80" />
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{stream.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{stream.host}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-[#25D366] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {stream.scheduledAt}
                      </span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {stream.followers}
                      </span>
                    </div>
                    <motion.button
                      className="mt-2 text-[10px] font-semibold px-3 py-1 rounded-full bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30"
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(37, 211, 102, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        Remind Me
                      </span>
                    </motion.button>
                  </div>
                </GlassmorphismCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Start Your Own Stream CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pb-8"
        >
          <GlassmorphismCard className="p-6" glow glowColor="rgba(18, 140, 126, 0.2)">
            <h3 className="text-lg font-bold mb-2 text-center bg-gradient-to-r from-[#25D366] to-[#128C7E] bg-clip-text text-transparent">
              Start Your Own Stream
            </h3>
            <p className="text-xs text-gray-400 text-center mb-4">
              Join thousands of creators who are earning while doing what they love.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { icon: Users, label: 'Active Creators', value: '2.4K+' },
                { icon: Eye, label: 'Daily Viewers', value: '50K+' },
                { icon: TrendingUp, label: 'Coins Earned', value: '1.2M+' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="flex flex-col items-center p-2 rounded-xl bg-[#111B21]/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <stat.icon className="w-5 h-5 text-[#25D366] mb-1" />
                  <span className="text-sm font-bold text-white">{stat.value}</span>
                  <span className="text-[9px] text-gray-500">{stat.label}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={handleGoLive}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white font-semibold text-sm shadow-lg"
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(7, 94, 84, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started Today
            </motion.button>
          </GlassmorphismCard>
        </motion.section>
      </div>
    </div>
  );
}

/* ─── Inline Host View ────────────────────────────── */
function LiveHostInline({ channelName, onClose }: { channelName: string; onClose: () => void }) {
  return <LiveHost channelName={channelName} onClose={onClose} />;
}

/* ─── Inline Audience View ────────────────────────── */
function LiveAudienceInline({
  channelName,
  streamTitle,
  hostName,
  onClose,
}: {
  channelName: string;
  streamTitle: string;
  hostName: string;
  onClose: () => void;
}) {
  return <LiveAudience channelName={channelName} streamTitle={streamTitle} hostName={hostName} onClose={onClose} />;
}
