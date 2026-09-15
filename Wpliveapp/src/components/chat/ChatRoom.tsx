'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Video } from 'lucide-react'; // Video icon එකතු කළා
import { useChatStore, useWalletStore, useCallStore } from '@/lib/store'; // useCallStore එකතු කළා
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import RomanticGiftPanel from './RomanticGiftPanel';
import { type RomanticGift } from '@/lib/store';
import { CoinIcon } from '@/components/three/CoinIcon';

// Mock data කොටස ඔයාගේ පරණ විදිහටම තියෙන්න හැරියා...
const mockChats: Record<string, any> = {
  chat1: { name: 'Sarah Johnson', avatar: 'SJ', color: '#FF6B6B', online: true, messages: [] },
  chat2: { name: 'CryptoMike', avatar: 'CM', color: '#4ECDC4', online: true, messages: [] },
  // ... අනෙක් mock chats ...
};

const defaultMockMessages = {
  name: 'Unknown', avatar: '??', color: '#888', online: false, messages: [{ id: 'm1', text: 'Hello! 👋', sent: false, time: 'Now' }],
};

export default function ChatRoom() {
  const { selectedChatId, setSelectedChatId, addMessage, chatMessages } = useChatStore();
  const { coinBalance, setCoinBalance, addTransaction } = useWalletStore();
  const { startCall } = useCallStore(); // 404 නැති කිරීමට මෙය අවශ්‍යයි
  
  const [isTyping, setIsTyping] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatData = selectedChatId ? mockChats[selectedChatId] || defaultMockMessages : null;
  const messages = selectedChatId ? chatMessages[selectedChatId] || (chatData ? chatData.messages : []) : [];

  // කොයින්ස් පිරිවැය ලොජික්
  const MESSAGE_COST = 10;
  const VIDEO_CALL_COST_PER_MIN = 2800;

  const canAffordMessage = coinBalance >= MESSAGE_COST;
  const canAffordCall = coinBalance >= VIDEO_CALL_COST_PER_MIN;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const triggerTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
  };

  // --- වීඩියෝ කෝල් එක පටන් ගැනීම (404 Error නොවී) ---
  const handleVideoCall = () => {
    if (!canAffordCall) {
      alert(`වීඩියෝ කෝල් එකක් ගැනීමට අවම වශයෙන් කොයින් ${VIDEO_CALL_COST_PER_MIN}ක් අවශ්‍ය වේ.`);
      return;
    }
    if (chatData) {
      // මෙතනදී router.push කරන්නේ නැහැ, ඒ නිසා 404 එන්නේ නැහැ
      startCall(chatData.name, 'video');
    }
  };

  const handleSend = (text: string) => {
    if (!selectedChatId) return;
    if (!canAffordMessage) {
      alert('මැසේජ් එකක් යැවීමට ප්‍රමාණවත් කොයින්ස් නැත!');
      return;
    }

    setCoinBalance((prev) => prev - MESSAGE_COST);
    addTransaction({
      id: `tx-${Date.now()}`,
      type: 'spend',
      amount: MESSAGE_COST,
      description: `Message to ${chatData?.name || 'chat'}`,
      timestamp: Date.now(),
    });

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newMsg = { id: `m${Date.now()}`, text, sent: true, time: timeStr };
    addMessage(selectedChatId, newMsg);
    triggerTyping();
  };

  const handleSendGift = (gift: RomanticGift) => {
    if (!selectedChatId) return;
    if (coinBalance < gift.cost) {
      alert('තෑග්ග යැවීමට ප්‍රමාණවත් කොයින්ස් නැත!');
      return;
    }

    setCoinBalance((prev) => prev - gift.cost);
    addTransaction({
      id: `tx-${Date.now()}`,
      type: 'gift',
      amount: gift.cost,
      description: `Sent ${gift.name} to ${chatData?.name || 'chat'}`,
      timestamp: Date.now(),
    });

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const giftMsg = {
      id: `m${Date.now()}`, text: `Sent a ${gift.name}!`, sent: true, time: timeStr,
      isGift: true, giftEmoji: gift.emoji, giftValue: gift.cost,
    };

    addMessage(selectedChatId, giftMsg);
    setShowGiftPanel(false);
    triggerTyping();
  };

  if (!selectedChatId || !chatData) return null;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#111B21]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 bg-[#075E54] shadow-lg shrink-0">
        <button onClick={() => setSelectedChatId(null)} className="p-2"><ArrowLeft className="text-white" /></button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: chatData.color }}>{chatData.avatar}</div>
        <div className="flex-1">
          <p className="text-white font-semibold">{chatData.name}</p>
          <p className="text-white/70 text-xs">{isTyping ? 'typing...' : (chatData.online ? 'Online' : 'last seen recently')}</p>
        </div>
        <CoinIcon size="sm" balance={coinBalance} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg: any) => (
            <ChatBubble key={msg.id} text={msg.text} sent={msg.sent} time={msg.time} isGift={msg.isGift} giftEmoji={msg.giftEmoji} giftValue={msg.giftValue} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - Video Call Function එක මෙතනට පාස් කළා */}
      <MessageInput
        onSend={handleSend}
        onGift={() => setShowGiftPanel(true)}
        onVideoCall={handleVideoCall}
        canAffordMessage={canAffordMessage}
      />

      <RomanticGiftPanel
        isOpen={showGiftPanel}
        onClose={() => setShowGiftPanel(false)}
        onSendGift={handleSendGift}
        receiverName={chatData.name}
      />
    </motion.div>
  );
}
