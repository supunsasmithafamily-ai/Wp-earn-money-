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
  Heart,
  MessageCircle,
  UserPlus,
  LogOut,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface LiveAudienceProps {
  channelName: string;
  streamTitle: string;
  hostName: string;
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
  { user: 'Nina', text: 'You are the best! 🌟', color: '#D7BDE2' },
  { user: 'Oscar', text: 'Subscribed! 💚', color: '#A3E4D7' },
];

const giftOptions = [
  { id: 'rose', emoji: '🌹', name: 'Rose', cost: 10 },
  { id: 'giftbox', emoji: '🎁', name: 'Gift Box', cost: 50 },
  { id: 'diamond', emoji: '💎', name: 'Diamond', cost: 100 },
  { id: 'crown', emoji: '👑', name: 'Crown', cost: 500 },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', cost: 1000 },
  { id: 'trophy', emoji: '🏆', name: 'Trophy', cost: 5000 },
];

export function LiveAudience({
  channelName,
  streamTitle,
  hostName,
  onClose,
}: LiveAudienceProps) {
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

  const [chatInput, setChatInput] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [selectedGift, setSelectedGift] = useState<typeof giftOptions[0] | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number }>>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const heartIdRef = useRef(0);

  // Simulate viewer count
  useEffect(() => {
    setViewerCount(Math.floor(800 + Math.random() * 400));
    const viewerInterval = setInterval(() => {
      setViewerCount((prev) => Math.max(100, prev + Math.floor(Math.random() * 20 - 8)));
    }, 4000);
    return () => clearInterval(viewerInterval);
  }, [setViewerCount]);

  // Auto-generate chat messages
  useEffect(() => {
    const chatInterval = setInterval(() => {
      const randomMsg = mockChatMessages[Math.floor(Math.random() * mockChatMessages.length)];
      addLiveMessage({
        id: `msg_${Date.now()}_${Math.random()}`,
        ...randomMsg,
        timestamp: Date.now(),
      });
    }, 2500 + Math.random() * 2500);
    return () => clearInterval(chatInterval);
  }, [addLiveMessage]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveMessages]);

  // Simulate incoming gifts from other viewers
  useEffect(() => {
    const giftInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        const randomGift = giftOptions[Math.floor(Math.random() * giftOptions.length)];
        const viewers = ['CryptoFan', 'Sarah', 'Mike', 'Alex', 'Luna', 'Dave', 'Jenny', 'Tom', 'Nina'];
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
    }, 7000);
    return () => clearInterval(giftInterval);
  }, [addLiveGift]);

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    addLiveMessage({
      id: `msg_viewer_${Date.now()}`,
      user: 'You',
      text: chatInput.trim(),
      color: '#25D366',
      timestamp: Date.now(),
    });
    setChatInput('');
  }, [chatInput, addLiveMessage]);

  const handleSendGift = useCallback(
    (gift: typeof giftOptions[0]) => {
      if (coinBalance < gift.cost) return;
      setCoinBalance(coinBalance - gift.cost);
      addTransaction({
        id: `tx_${Date.now()}`,
        type: 'gift_sent',
        amount: -gift.cost,
        description: `Sent ${gift.emoji} ${gift.name} to ${hostName}`,
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
    [coinBalance, setCoinBalance, addTransaction, addLiveGift, hostName]
  );

  const handleSendHeart = useCallback(() => {
    const id = heartIdRef.current++;
    const x = 30 + Math.random() * 40; // 30-70% from left
    setFloatingHearts((prev) => [...prev, { id, x }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  }, []);

  const handleLeave = useCallback(() => {
    clearLiveState();
    onClose();
  }, [clearLiveState, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-[#111B21] flex flex-col">
      {/* Video Area */}
      <div className="relative flex-1 min-h-0">
        {/* Gradient placeholder for stream video */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-[#075E54] to-[#1F2C34]">
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-48 h-48 rounded-full bg-purple-500/10"
              animate={{
                x: [0, 120, -60, 0],
                y: [0, -100, 60, 0],
                scale: [1, 1.3, 0.8, 1],
              }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-[#25D366]/10"
              animate={{
                x: [0, -90, 70, 0],
                y: [0, 60, -90, 0],
              }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Stream title overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="flex flex-col items-center gap-3 opacity-40"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold">
                {hostName.charAt(0)}
              </div>
              <span className="text-sm text-white/60">{streamTitle}</span>
            </motion.div>
          </div>
        </div>

        {/* Gift Animations */}
        <GiftAnimation gifts={liveGifts} position="center" />

        {/* Floating Hearts */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <AnimatePresence>
            {floatingHearts.map((heart) => (
              <motion.div
                key={heart.id}
                initial={{ opacity: 1, y: 0, scale: 0.5, x: `${heart.x}%` }}
                animate={{
                  opacity: 0,
                  y: -300,
                  scale: [0.5, 1.2, 0.8],
                  x: `${heart.x + (Math.random() - 0.5) * 10}%`,
                  rotate: [0, -15, 15, -10, 10],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: 'easeOut' }}
                className="absolute bottom-20 text-3xl"
              >
                ❤️
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Top Bar */}
        <div className="absolute top-0 inset-x-0 z-30">
          <div className="bg-gradient-to-b from-black/70 via-black/40 to-transparent px-4 pt-3 pb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Host avatar & info */}
                <div className="flex items-center gap-2 min-w-0">
                  <motion.div
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2 ring-red-500"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {hostName.charAt(0)}
                  </motion.div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white truncate">{hostName}</span>
                      <motion.div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-600 flex-shrink-0"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                        />
                        <span className="text-[9px] font-bold text-white">LIVE</span>
                      </motion.div>
                    </div>
                    <span className="text-[10px] text-gray-300 truncate block">{streamTitle}</span>
                  </div>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Viewer count */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
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

                {/* Follow */}
                <motion.button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    isFollowing
                      ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40'
                      : 'bg-red-600 text-white'
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  {isFollowing ? (
                    <>
                      <UserPlus className="w-3 h-3" />
                      Following
                    </>
                  ) : (
                    'Follow'
                  )}
                </motion.button>

                {/* Coin balance */}
                <CoinIcon balance={coinBalance} size="sm" />

                {/* Leave */}
                <motion.button
                  onClick={handleLeave}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <LogOut className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Overlay on the left/bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="px-3 pb-2 max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2A3942 transparent' }}>
            {liveMessages.slice(-15).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-1.5"
              >
                <div className="inline-block max-w-[85%] px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md">
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
            className="absolute bottom-20 left-0 right-0 z-40 px-3"
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

          {/* Heart button */}
          <motion.button
            onClick={handleSendHeart}
            className="w-9 h-9 rounded-full bg-pink-600 flex items-center justify-center"
            whileTap={{ scale: 0.8 }}
          >
            <Heart className="w-4 h-4 text-white fill-white" />
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

          {/* Mute */}
          <motion.button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isMuted ? 'bg-red-600' : 'bg-[#2A3942]'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
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
    </div>
  );
}
