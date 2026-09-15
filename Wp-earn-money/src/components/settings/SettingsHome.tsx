'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  Bell,
  BellRing,
  Gift,
  Monitor,
  Wallet,
  Globe,
  Trash2,
  Info,
  ChevronRight,
  Camera,
  Palette,
  Moon,
  Sun,
  LogOut,
  User,
  Pencil,
  WalletMinimal,
  FileText,
  ArrowDownToLine,
} from 'lucide-react';
import { GlassmorphismCard } from '@/components/three/GlassmorphismCard';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────
interface SettingItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onClick?: () => void;
  destructive?: boolean;
}

interface SettingsGroup {
  title: string;
  items: SettingItem[];
}

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── Animation Variants ───────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

// ─── Main Component ───────────────────────────────────
export default function SettingsHome() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const displayUser = {
    displayName: user?.displayName || 'User',
    email: user?.email || '',
    initials: getInitials(user?.displayName || 'User'),
    color: '#075E54',
  };

  const [settings, setSettings] = useState({
    // Privacy
    showOnline: true,
    readReceipts: true,
    profilePhotoVisible: true,
    // Notifications
    pushNotifications: true,
    liveStreamAlerts: true,
    giftNotifications: true,
    // Streaming
    allowGifts: true,
    // App
    darkMode: true,
  });

  const toggleSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // ═══════════════════════════════════════════════════════
  //  Placeholder Click Handlers
  //  (Connect these to Firebase / real logic later)
  // ═══════════════════════════════════════════════════════

  const handleEditProfile = useCallback(() => {
    alert('Edit Profile: Open profile editor to update name, photo, and bio.');
    // TODO: Navigate to /settings/edit-profile or open a modal
    // TODO: Fetch current profile from Firestore and pre-fill form
    // TODO: Save changes to Firebase Auth & Firestore
  }, []);

  const handlePhoneClick = useCallback(() => {
    alert('Phone Number: Open phone number edit modal.\n\nCurrent: +1 (555) 123-4567\n\nSteps:\n1. Send OTP to current number\n2. Verify OTP\n3. Enter new number\n4. Verify new OTP\n5. Update in Firebase Auth');
    // TODO: Open phone verification modal
    // TODO: Use Firebase Auth updatePhoneNumber()
  }, []);

  const handleEmailClick = useCallback(() => {
    alert('Email: Open email edit modal.\n\nCurrent: alex.johnson@email.com\n\nSteps:\n1. Verify current password\n2. Enter new email\n3. Send verification link\n4. Confirm in email inbox');
    // TODO: Open email change modal
    // TODO: Use Firebase Auth verifyBeforeUpdateEmail()
  }, []);

  const handle2FAClick = useCallback(() => {
    alert('Two-Factor Authentication: Open 2FA settings.\n\nStatus: Enabled\n\nOptions:\n• Disable 2FA (requires current password)\n• Change backup codes\n• Switch to SMS authenticator');
    // TODO: Open 2FA management modal
    // TODO: Use Firebase Auth multi-factor settings
  }, []);

  const handleStreamQualityClick = useCallback(() => {
    alert('Stream Quality: Open quality selector.\n\nCurrent: Auto\n\nOptions:\n• Auto (recommended)\n• Low (360p, saves data)\n• Medium (720p)\n• High (1080p)\n• Ultra (1440p, requires WiFi)');
    // TODO: Open quality picker bottom sheet
    // TODO: Save preference to Firestore user settings
  }, []);

  const handleMinGiftValueClick = useCallback(() => {
    alert('Minimum Gift Value: Open gift threshold editor.\n\nCurrent: 10 coins\n\nOptions:\n• No minimum\n• 10 coins\n• 50 coins\n• 100 coins\n• 500 coins\n• Custom amount');
    // TODO: Open minimum gift value picker
    // TODO: Save to Firestore user settings
  }, []);

  const handleConnectedWalletsClick = useCallback(() => {
    alert('Connected Wallets: Open wallet management.\n\nConnected: 1 wallet\n• TRC20 (USDT)\n\nActions:\n• Add new wallet\n• Remove wallet\n• Set default wallet');
    // TODO: Open wallet management modal
    // TODO: Fetch from Firestore user.wallets[]
  }, []);

  const handleTransactionHistoryClick = useCallback(() => {
    alert('Transaction History: Navigate to full transaction list.\n\nShows all coin purchases, gifts sent/received, and withdrawals.');
    // TODO: Navigate to /wallet/transactions
    // TODO: Fetch from Firestore transactions collection
  }, []);

  const handleWithdrawalSettingsClick = useCallback(() => {
    alert('Withdrawal Settings: Open withdrawal configuration.\n\nCurrent network: TRC20\nWallet: 0x••••••••4a2b\nMinimum: 1,000 coins');
    // TODO: Open withdrawal settings modal
    // TODO: Fetch from Firestore user.withdrawalSettings
  }, []);

  const handleLanguageClick = useCallback(() => {
    alert('Language: Open language selector.\n\nCurrent: English\n\nAvailable:\n• English\n• Spanish\n• French\n• Arabic\n• Chinese\n• Hindi');
    // TODO: Open language picker bottom sheet
    // TODO: Save to localStorage and Firestore
  }, []);

  const handleClearCacheClick = useCallback(() => {
    const confirmed = confirm(
      'Clear Cache?\n\nThis will:\n• Clear image cache\n• Clear chat cache\n• Log you out of all devices\n\nThis action cannot be undone.'
    );
    if (confirmed) {
      alert('Cache cleared successfully! Please log in again.');
      // TODO: Clear localStorage, sessionStorage, IndexedDB
      // TODO: Sign out from Firebase Auth
      // TODO: Navigate to /login
    }
  }, []);

  const handleAboutClick = useCallback(() => {
    alert('About Wp-earn-money\n\nVersion: 1.0.0\nBuild: 2026.04.02\n\nA WhatsApp-inspired mobile-first PWA with live streaming, virtual gifts, and crypto economy.\n\nPowered by Next.js, Firebase, Agora, and OxaPay.');
    // TODO: Open About page or modal
  }, []);

  const handleLogoutClick = useCallback(async () => {
    const confirmed = confirm(
      'Log Out?\n\nYou will need to sign in again to access your chats, wallet, and live streams.'
    );
    if (confirmed) {
      await logout();
      router.push('/login');
    }
  }, [logout, router]);

  // ─── Settings Groups ────────────────────────────────
  const groups: SettingsGroup[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'phone',
          label: 'Phone Number',
          icon: <Phone className="w-[18px] h-[18px]" style={{ color: '#128C7E' }} />,
          value: '+1 (555) 123-4567',
          onClick: handlePhoneClick,
        },
        {
          id: 'email',
          label: 'Email',
          icon: <Mail className="w-[18px] h-[18px]" style={{ color: '#25D366' }} />,
          value: displayUser.email,
          onClick: handleEmailClick,
        },
        {
          id: '2fa',
          label: 'Two-Factor Auth',
          icon: <ShieldCheck className="w-[18px] h-[18px]" style={{ color: '#FFD700' }} />,
          value: 'Enabled',
          onClick: handle2FAClick,
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          id: 'showOnline',
          label: 'Who Can See Me Online',
          icon: <Eye className="w-[18px] h-[18px]" style={{ color: '#25D366' }} />,
          value: 'Everyone',
          toggle: true,
          toggleValue: settings.showOnline,
          onToggle: (v) => toggleSetting('showOnline', v),
        },
        {
          id: 'readReceipts',
          label: 'Read Receipts',
          icon: <EyeOff className="w-[18px] h-[18px]" style={{ color: '#8696A0' }} />,
          toggle: true,
          toggleValue: settings.readReceipts,
          onToggle: (v) => toggleSetting('readReceipts', v),
        },
        {
          id: 'profilePhotoVisible',
          label: 'Profile Photo Visibility',
          icon: <Camera className="w-[18px] h-[18px]" style={{ color: '#805DE2' }} />,
          value: 'Everyone',
          toggle: true,
          toggleValue: settings.profilePhotoVisible,
          onToggle: (v) => toggleSetting('profilePhotoVisible', v),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'pushNotifications',
          label: 'Push Notifications',
          icon: <Bell className="w-[18px] h-[18px]" style={{ color: '#25D366' }} />,
          toggle: true,
          toggleValue: settings.pushNotifications,
          onToggle: (v) => toggleSetting('pushNotifications', v),
        },
        {
          id: 'liveStreamAlerts',
          label: 'Live Stream Alerts',
          icon: <BellRing className="w-[18px] h-[18px]" style={{ color: '#FFD700' }} />,
          toggle: true,
          toggleValue: settings.liveStreamAlerts,
          onToggle: (v) => toggleSetting('liveStreamAlerts', v),
        },
        {
          id: 'giftNotifications',
          label: 'Gift Notifications',
          icon: <Gift className="w-[18px] h-[18px]" style={{ color: '#FF6B6B' }} />,
          toggle: true,
          toggleValue: settings.giftNotifications,
          onToggle: (v) => toggleSetting('giftNotifications', v),
        },
      ],
    },
    {
      title: 'Streaming',
      items: [
        {
          id: 'defaultQuality',
          label: 'Default Stream Quality',
          icon: <Monitor className="w-[18px] h-[18px]" style={{ color: '#128C7E' }} />,
          value: 'Auto',
          onClick: handleStreamQualityClick,
        },
        {
          id: 'allowGifts',
          label: 'Allow Gifts on Stream',
          icon: <Gift className="w-[18px] h-[18px]" style={{ color: '#FFD700' }} />,
          toggle: true,
          toggleValue: settings.allowGifts,
          onToggle: (v) => toggleSetting('allowGifts', v),
        },
        {
          id: 'minGiftValue',
          label: 'Minimum Gift Value',
          icon: <Gift className="w-[18px] h-[18px]" style={{ color: '#8696A0' }} />,
          value: '10 coins',
          onClick: handleMinGiftValueClick,
        },
      ],
    },
    {
      title: 'Wallet',
      items: [
        {
          id: 'connectedWallets',
          label: 'Connected Wallets',
          icon: <Wallet className="w-[18px] h-[18px]" style={{ color: '#805DE2' }} />,
          value: '1 wallet',
          onClick: handleConnectedWalletsClick,
        },
        {
          id: 'transactionHistory',
          label: 'Transaction History',
          icon: <Wallet className="w-[18px] h-[18px]" style={{ color: '#25D366' }} />,
          onClick: handleTransactionHistoryClick,
        },
        {
          id: 'withdrawalSettings',
          label: 'Withdrawal Settings',
          icon: <Wallet className="w-[18px] h-[18px]" style={{ color: '#FFD700' }} />,
          onClick: handleWithdrawalSettingsClick,
        },
      ],
    },
    {
      title: 'App',
      items: [
        {
          id: 'theme',
          label: 'Theme',
          icon: settings.darkMode
            ? <Moon className="w-[18px] h-[18px]" style={{ color: '#128C7E' }} />
            : <Sun className="w-[18px] h-[18px]" style={{ color: '#FFD700' }} />,
          value: settings.darkMode ? 'Dark' : 'Light',
          toggle: true,
          toggleValue: settings.darkMode,
          onToggle: (v) => toggleSetting('darkMode', v),
        },
        {
          id: 'language',
          label: 'Language',
          icon: <Globe className="w-[18px] h-[18px]" style={{ color: '#25D366' }} />,
          value: 'English',
          onClick: handleLanguageClick,
        },
        {
          id: 'clearCache',
          label: 'Clear Cache',
          icon: <Trash2 className="w-[18px] h-[18px]" style={{ color: '#EA4335' }} />,
          destructive: true,
          onClick: handleClearCacheClick,
        },
        {
          id: 'about',
          label: 'About',
          icon: <Info className="w-[18px] h-[18px]" style={{ color: '#8696A0' }} />,
          onClick: handleAboutClick,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-4" style={{ background: '#111B21' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {/* ── Profile Section ── */}
        <motion.div variants={itemVariants}>
          <GlassmorphismCard className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <button
              onClick={handleEditProfile}
              className="group relative shrink-0"
              aria-label="Edit profile picture"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 group-hover:scale-105 group-hover:ring-2 group-hover:ring-[#25D366]/50"
                style={{
                  background: `linear-gradient(135deg, ${displayUser.color}, #128C7E)`,
                  color: '#fff',
                  boxShadow: `0 4px 16px ${displayUser.color}40`,
                }}
              >
                {displayUser.initials}
              </div>
              {/* Camera overlay on hover */}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              >
                <Pencil className="w-4 h-4 text-white" />
              </div>
            </button>

            <button className="flex-1 min-w-0 bg-transparent border-0 p-0 cursor-pointer text-left" onClick={handleEditProfile}>
              <h2 className="text-base font-semibold truncate" style={{ color: '#E9EDEF' }}>
                {displayUser.displayName}
              </h2>
              <p className="text-sm truncate" style={{ color: '#8696A0' }}>
                {displayUser.email}
              </p>
            </button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleEditProfile}
              className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95"
              style={{
                background: 'rgba(7,94,84,0.3)',
                border: '1px solid rgba(18,140,126,0.4)',
                color: '#25D366',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(7,94,84,0.55)';
                e.currentTarget.style.borderColor = 'rgba(37,211,102,0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(7,94,84,0.3)';
                e.currentTarget.style.borderColor = 'rgba(18,140,126,0.4)';
              }}
              aria-label="Edit Profile"
            >
              Edit Profile
            </motion.button>
          </GlassmorphismCard>
        </motion.div>

        {/* ── Settings Groups ── */}
        {groups.map((group, groupIndex) => (
          <motion.div key={group.title} variants={itemVariants} className="mb-5">
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
              style={{ color: '#8696A0' }}
            >
              {group.title}
            </h3>
            <GlassmorphismCard noPadding hover={false}>
              {group.items.map((item, itemIndex) => {
                const isClickable = !!item.onClick || (item.toggle && !!item.onToggle);

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!isClickable}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150"
                    style={{
                      borderBottom:
                        itemIndex < group.items.length - 1
                          ? '1px solid rgba(255,255,255,0.06)'
                          : 'none',
                      cursor: isClickable ? 'pointer' : 'default',
                      background: 'transparent',
                      borderLeft: 'none',
                      borderTop: 'none',
                      borderRight: 'none',
                    }}
                    onClick={() => {
                      if (item.toggle && item.onToggle) {
                        item.onToggle(!item.toggleValue);
                      } else if (item.onClick) {
                        item.onClick();
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.background =
                          'rgba(255,255,255,0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    aria-label={item.label}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      {item.icon}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm"
                        style={{
                          color: item.destructive ? '#EA4335' : '#E9EDEF',
                        }}
                      >
                        {item.label}
                      </p>
                    </div>

                    {/* Right side: Toggle, Value+Chevron, or just Chevron */}
                    {item.toggle ? (
                      <div
                        className="w-10 h-[22px] rounded-full p-0.5 transition-all duration-200 shrink-0"
                        style={{
                          background: item.toggleValue
                            ? 'linear-gradient(135deg, #25D366, #128C7E)'
                            : 'rgba(255,255,255,0.15)',
                          justifyContent: item.toggleValue
                            ? 'flex-end'
                            : 'flex-start',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          className="w-[18px] h-[18px] rounded-full transition-all duration-200 shadow-sm"
                          style={{
                            background: item.toggleValue ? '#fff' : '#8696A0',
                          }}
                        />
                      </div>
                    ) : item.value ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-xs"
                          style={{ color: '#8696A0' }}
                        >
                          {item.value}
                        </span>
                        <ChevronRight
                          className="w-4 h-4"
                          style={{ color: '#667781' }}
                        />
                      </div>
                    ) : (
                      <ChevronRight
                        className="w-4 h-4 shrink-0"
                        style={{ color: '#667781' }}
                      />
                    )}
                  </button>
                );
              })}
            </GlassmorphismCard>
          </motion.div>
        ))}

        {/* ── Log Out ── */}
        <motion.div variants={itemVariants} className="mb-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogoutClick}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
            style={{
              background: 'rgba(234,67,53,0.08)',
              border: '1px solid rgba(234,67,53,0.2)',
              color: '#EA4335',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(234,67,53,0.16)';
              e.currentTarget.style.borderColor = 'rgba(234,67,53,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(234,67,53,0.08)';
              e.currentTarget.style.borderColor = 'rgba(234,67,53,0.2)';
            }}
          >
            <LogOut className="w-[18px] h-[18px]" />
            Log Out
          </motion.button>
        </motion.div>

        {/* ── Version ── */}
        <motion.div variants={itemVariants} className="text-center pb-4">
          <p className="text-[11px]" style={{ color: '#667781' }}>
            App Version 1.0.0
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
