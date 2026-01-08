import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Switch, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Package,
  FileText,
  Users,
  Zap,
  Wrench,
  Bell,
  Palette,
  Cloud,
  Wifi,
  HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  Music,
  Shield,
  EyeOff,
  X,
  Check,
  Mail,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTourFlowStore, type AppSettings, type UserRole } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/cn';

export default function MoreScreen() {
  const router = useRouter();
  const tours = useTourFlowStore(s => s.tours);
  const gear = useTourFlowStore(s => s.gear);
  const userProfile = useTourFlowStore(s => s.userProfile);
  const settings = useTourFlowStore(s => s.settings);
  const updateSettings = useTourFlowStore(s => s.updateSettings);
  const currentUserRole = useTourFlowStore(s => s.currentUserRole);
  const setUserRole = useTourFlowStore(s => s.setUserRole);

  // Auth context
  const { user, isAuthenticated, signOut: authSignOut, tourMemberships, pendingInvitations } = useAuth();
  const isSupabaseReady = isSupabaseConfigured();

  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);

  const activeTour = tours.find(t => t.status === 'upcoming' || t.status === 'active');
  const gearIssues = gear.filter(g => g.condition === 'needs_repair' || g.condition === 'fair');

  const navigateTo = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <LinearGradient
        colors={['#0f1419', '#0a0a0f']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-5 pt-4 pb-6">
            <Text className="text-gray-500 text-sm font-medium tracking-wider uppercase">Tour Flow</Text>
            <Text className="text-white text-2xl font-bold mt-1">More</Text>
          </View>

          {/* Profile Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="mx-5 mb-6"
          >
            <Pressable
              onPress={() => {
                setShowRoleModal(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <LinearGradient
                colors={['#1a1a2e', '#16213e']}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-full bg-emerald-500/20 items-center justify-center mr-4">
                    <User size={24} color="#00d4aa" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-lg font-bold">
                      {isAuthenticated && user?.user_metadata?.full_name
                        ? String(user.user_metadata.full_name)
                        : userProfile.name || 'Tour Flow User'}
                    </Text>
                    {isAuthenticated && user?.email ? (
                      <View className="flex-row items-center mt-0.5">
                        <Mail size={12} color="#6b7280" />
                        <Text className="text-gray-400 text-sm ml-1">{user.email}</Text>
                      </View>
                    ) : (
                      <Text className="text-gray-400 text-sm">{userProfile.role}</Text>
                    )}
                    <View className="flex-row items-center mt-1">
                      <View className={cn(
                        "px-2 py-0.5 rounded-full",
                        currentUserRole === 'admin' ? "bg-emerald-500/20" : "bg-gray-500/20"
                      )}>
                        <Text className={cn(
                          "text-xs font-medium",
                          currentUserRole === 'admin' ? "text-emerald-400" : "text-gray-400"
                        )}>
                          {currentUserRole === 'admin' ? 'Admin' : 'User'}
                        </Text>
                      </View>
                      {settings.stealthMode && (
                        <View className="ml-2 flex-row items-center bg-amber-500/20 px-2 py-0.5 rounded-full">
                          <EyeOff size={10} color="#f59e0b" />
                          <Text className="text-amber-400 text-xs ml-1">Stealth</Text>
                        </View>
                      )}
                      {isAuthenticated && (
                        <View className="ml-2 flex-row items-center bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          <Check size={10} color="#00d4aa" />
                          <Text className="text-emerald-400 text-xs ml-1">Signed In</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={20} color="#6b7280" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(120).duration(400)}
              className="mx-5 mb-6"
            >
              <Pressable
                onPress={() => {
                  setShowInvitationsModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                    <Mail size={18} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-blue-400 font-semibold">
                      {pendingInvitations.length} Pending Invitation{pendingInvitations.length > 1 ? 's' : ''}
                    </Text>
                    <Text className="text-gray-500 text-xs">Tap to view and accept</Text>
                  </View>
                  <ChevronRight size={18} color="#3b82f6" />
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* Active Tour */}
          {activeTour && (
            <Animated.View
              entering={FadeInDown.delay(150).duration(400)}
              className="mx-5 mb-6"
            >
              <Pressable onPress={() => navigateTo('/tours')}>
                <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
                    <Music size={18} color="#00d4aa" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-xs uppercase tracking-wider">Active Tour</Text>
                    <Text className="text-white font-semibold">{activeTour.name}</Text>
                    <Text className="text-gray-500 text-xs">{activeTour.shows.length} shows</Text>
                  </View>
                  <ChevronRight size={18} color="#00d4aa" />
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* Tour Management */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            className="mx-5 mb-6"
          >
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 ml-1">
              Tour Management
            </Text>
            <View className="bg-[#1a1a2e] rounded-xl overflow-hidden">
              <MenuRow
                icon={Package}
                iconColor="#8b5cf6"
                label="Gear Inventory"
                badge={gearIssues.length > 0 ? `${gearIssues.length} issues` : undefined}
                badgeColor="#f59e0b"
                onPress={() => navigateTo('/gear')}
              />
              <MenuRow
                icon={FileText}
                iconColor="#3b82f6"
                label="Documents"
                onPress={() => navigateTo('/documents')}
              />
              <MenuRow
                icon={Users}
                iconColor="#f59e0b"
                label="Crews"
                onPress={() => navigateTo('/crews')}
              />
              <MenuRow
                icon={Zap}
                iconColor="#00d4aa"
                label="AI Assistant"
                onPress={() => navigateTo('/assistant')}
              />
              <MenuRow
                icon={Wrench}
                iconColor="#ef4444"
                label="Maintenance"
                badge={gearIssues.length > 0 ? `${gearIssues.length}` : undefined}
                badgeColor="#ef4444"
                onPress={() => navigateTo('/gear')}
                isLast
              />
            </View>
          </Animated.View>

          {/* Settings */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            className="mx-5 mb-6"
          >
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 ml-1">
              Settings
            </Text>
            <View className="bg-[#1a1a2e] rounded-xl overflow-hidden">
              <MenuRow
                icon={Bell}
                iconColor="#ec4899"
                label="Notifications"
                value={settings.notificationsEnabled ? 'On' : 'Off'}
                onPress={() => {
                  setShowNotificationsModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
              <MenuRow
                icon={Palette}
                iconColor="#a855f7"
                label="Appearance"
                value={settings.appearance === 'dark' ? 'Dark' : settings.appearance === 'light' ? 'Light' : 'System'}
                onPress={() => {
                  setShowAppearanceModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
              <MenuRow
                icon={Cloud}
                iconColor="#06b6d4"
                label="Sync & Backup"
                value={settings.lastSyncDate ? 'Synced' : 'Not synced'}
                onPress={() => {
                  setShowSyncModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
              <MenuRow
                icon={Wifi}
                iconColor="#22c55e"
                label="Offline Mode"
                value={settings.offlineModeEnabled ? 'Enabled' : 'Disabled'}
                onPress={() => {
                  setShowOfflineModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                isLast
              />
            </View>
          </Animated.View>

          {/* Support */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            className="mx-5 mb-6"
          >
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 ml-1">
              Support
            </Text>
            <View className="bg-[#1a1a2e] rounded-xl overflow-hidden">
              <MenuRow
                icon={HelpCircle}
                iconColor="#f59e0b"
                label="Help Center"
                onPress={() => {
                  setShowHelpModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
              <MenuRow
                icon={Info}
                iconColor="#6b7280"
                label="About"
                value="v1.0.0"
                onPress={() => {
                  setShowAboutModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                isLast
              />
            </View>
          </Animated.View>

          {/* Sign Out */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(400)}
            className="mx-5 mb-8"
          >
            <Pressable
              onPress={async () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                if (isAuthenticated && isSupabaseReady) {
                  await authSignOut();
                  router.replace('/auth');
                }
              }}
              className={cn(
                "border rounded-xl p-4 flex-row items-center justify-center",
                isAuthenticated && isSupabaseReady
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-gray-500/10 border-gray-500/20"
              )}
            >
              <LogOut size={18} color={isAuthenticated && isSupabaseReady ? "#ef4444" : "#6b7280"} />
              <Text className={cn(
                "font-semibold ml-2",
                isAuthenticated && isSupabaseReady ? "text-red-400" : "text-gray-500"
              )}>
                {isAuthenticated && isSupabaseReady ? 'Sign Out' : 'Not Signed In'}
              </Text>
            </Pressable>
          </Animated.View>

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotificationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <NotificationsModal
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowNotificationsModal(false)}
        />
      </Modal>

      {/* Appearance Modal */}
      <Modal
        visible={showAppearanceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAppearanceModal(false)}
      >
        <AppearanceModal
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowAppearanceModal(false)}
        />
      </Modal>

      {/* Sync Modal */}
      <Modal
        visible={showSyncModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSyncModal(false)}
      >
        <SyncModal
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSyncModal(false)}
        />
      </Modal>

      {/* Offline Modal */}
      <Modal
        visible={showOfflineModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOfflineModal(false)}
      >
        <OfflineModal
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowOfflineModal(false)}
        />
      </Modal>

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <HelpModal onClose={() => setShowHelpModal(false)} />
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <AboutModal onClose={() => setShowAboutModal(false)} />
      </Modal>

      {/* Role Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <RoleModal
          currentRole={currentUserRole}
          onSelectRole={(role) => {
            setUserRole(role);
            setShowRoleModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          onClose={() => setShowRoleModal(false)}
        />
      </Modal>

      {/* Invitations Modal */}
      <Modal
        visible={showInvitationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInvitationsModal(false)}
      >
        <InvitationsModal
          invitations={pendingInvitations}
          onClose={() => setShowInvitationsModal(false)}
        />
      </Modal>
    </View>
  );
}

function MenuRow({
  icon: Icon,
  iconColor,
  label,
  value,
  badge,
  badgeColor,
  onPress,
  isLast,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  label: string;
  value?: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center px-4 py-4",
        !isLast && "border-b border-white/5"
      )}
    >
      <View
        className="w-9 h-9 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Icon size={18} color={iconColor} />
      </View>
      <Text className="text-white flex-1 text-base font-medium">{label}</Text>
      {badge && (
        <View className="px-2 py-0.5 rounded-full mr-2" style={{ backgroundColor: `${badgeColor}20` }}>
          <Text className="text-xs font-medium" style={{ color: badgeColor }}>{badge}</Text>
        </View>
      )}
      {value && <Text className="text-gray-500 text-sm mr-2">{value}</Text>}
      <ChevronRight size={18} color="#4b5563" />
    </Pressable>
  );
}

function NotificationsModal({ settings, onUpdate, onClose }: { settings: AppSettings; onUpdate: (s: Partial<AppSettings>) => void; onClose: () => void }) {
  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}><X size={24} color="#6b7280" /></Pressable>
          <Text className="text-white text-lg font-semibold">Notifications</Text>
          <View className="w-6" />
        </View>
        <ScrollView className="flex-1 px-5 pt-6">
          <View className="bg-[#1a1a2e] rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-medium">Push Notifications</Text>
                <Text className="text-gray-500 text-sm mt-1">Receive alerts for shows and tasks</Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(v) => onUpdate({ notificationsEnabled: v })}
                trackColor={{ false: '#3a3a3a', true: '#00d4aa50' }}
                thumbColor={settings.notificationsEnabled ? '#00d4aa' : '#6b7280'}
              />
            </View>
          </View>
          <Text className="text-gray-500 text-xs px-2">
            When enabled, you will receive notifications for upcoming shows, task reminders, and gear maintenance alerts.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AppearanceModal({ settings, onUpdate, onClose }: { settings: AppSettings; onUpdate: (s: Partial<AppSettings>) => void; onClose: () => void }) {
  const options: { value: AppSettings['appearance']; label: string; desc: string }[] = [
    { value: 'dark', label: 'Dark', desc: 'Always use dark mode' },
    { value: 'light', label: 'Light', desc: 'Always use light mode' },
    { value: 'system', label: 'System', desc: 'Follow system settings' },
  ];

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}><X size={24} color="#6b7280" /></Pressable>
          <Text className="text-white text-lg font-semibold">Appearance</Text>
          <View className="w-6" />
        </View>
        <ScrollView className="flex-1 px-5 pt-6">
          {options.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => {
                onUpdate({ appearance: opt.value });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                "bg-[#1a1a2e] rounded-xl p-4 mb-3 flex-row items-center",
                settings.appearance === opt.value && "border border-emerald-500/30"
              )}
            >
              <View className="flex-1">
                <Text className="text-white font-medium">{opt.label}</Text>
                <Text className="text-gray-500 text-sm">{opt.desc}</Text>
              </View>
              {settings.appearance === opt.value && (
                <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center">
                  <Check size={14} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SyncModal({ settings, onUpdate, onClose }: { settings: AppSettings; onUpdate: (s: Partial<AppSettings>) => void; onClose: () => void }) {
  const handleSync = () => {
    onUpdate({ lastSyncDate: new Date().toISOString() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}><X size={24} color="#6b7280" /></Pressable>
          <Text className="text-white text-lg font-semibold">Sync & Backup</Text>
          <View className="w-6" />
        </View>
        <ScrollView className="flex-1 px-5 pt-6">
          <View className="bg-[#1a1a2e] rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Cloud size={20} color="#06b6d4" />
              <Text className="text-white font-medium ml-2">Last Sync</Text>
            </View>
            <Text className="text-gray-400">
              {settings.lastSyncDate
                ? new Date(settings.lastSyncDate).toLocaleString()
                : 'Never synced'}
            </Text>
          </View>
          <Pressable
            onPress={handleSync}
            className="bg-emerald-500 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold">Sync Now</Text>
          </Pressable>
          <Text className="text-gray-500 text-xs px-2 mt-4 text-center">
            Your data is automatically saved locally. Sync to backup to the cloud.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function OfflineModal({ settings, onUpdate, onClose }: { settings: AppSettings; onUpdate: (s: Partial<AppSettings>) => void; onClose: () => void }) {
  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}><X size={24} color="#6b7280" /></Pressable>
          <Text className="text-white text-lg font-semibold">Offline Mode</Text>
          <View className="w-6" />
        </View>
        <ScrollView className="flex-1 px-5 pt-6">
          <View className="bg-[#1a1a2e] rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-white font-medium">Enable Offline Mode</Text>
                <Text className="text-gray-500 text-sm mt-1">Access tour data without internet</Text>
              </View>
              <Switch
                value={settings.offlineModeEnabled}
                onValueChange={(v) => onUpdate({ offlineModeEnabled: v })}
                trackColor={{ false: '#3a3a3a', true: '#00d4aa50' }}
                thumbColor={settings.offlineModeEnabled ? '#00d4aa' : '#6b7280'}
              />
            </View>
          </View>
          <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <Text className="text-emerald-400 font-medium mb-2">Offline Features</Text>
            <Text className="text-gray-400 text-sm">- View tour schedules and dates</Text>
            <Text className="text-gray-400 text-sm">- Access gear inventory</Text>
            <Text className="text-gray-400 text-sm">- View crew contacts</Text>
            <Text className="text-gray-400 text-sm">- Read saved documents</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const topics = [
    { title: 'Getting Started', desc: 'Learn the basics of Tour Flow' },
    { title: 'Managing Tours', desc: 'Create and edit tour schedules' },
    { title: 'Gear Inventory', desc: 'Track your equipment' },
    { title: 'Documents', desc: 'Manage riders and input lists' },
    { title: 'AI Assistant', desc: 'Generate day sheets and more' },
  ];

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}><X size={24} color="#6b7280" /></Pressable>
          <Text className="text-white text-lg font-semibold">Help Center</Text>
          <View className="w-6" />
        </View>
        <ScrollView className="flex-1 px-5 pt-6">
          {topics.map((topic, i) => (
            <Pressable
              key={i}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              className="bg-[#1a1a2e] rounded-xl p-4 mb-3 flex-row items-center"
            >
              <View className="flex-1">
                <Text className="text-white font-medium">{topic.title}</Text>
                <Text className="text-gray-500 text-sm">{topic.desc}</Text>
              </View>
              <ChevronRight size={18} color="#6b7280" />
            </Pressable>
          ))}
          <Pressable
            onPress={() => Linking.openURL('mailto:support@tourflow.io')}
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mt-4 items-center"
          >
            <Text className="text-emerald-400 font-medium">Contact Support</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}><X size={24} color="#6b7280" /></Pressable>
          <Text className="text-white text-lg font-semibold">About</Text>
          <View className="w-6" />
        </View>
        <View className="flex-1 px-5 pt-10 items-center">
          <View className="w-20 h-20 rounded-2xl bg-emerald-500/20 items-center justify-center mb-4">
            <Zap size={36} color="#00d4aa" />
          </View>
          <Text className="text-white text-2xl font-bold">Tour Flow</Text>
          <Text className="text-gray-500 text-sm mt-1">Version 1.0.0</Text>
          <Text className="text-gray-400 text-center mt-6 px-4">
            The ultimate tour management app for audio engineers and touring professionals.
          </Text>
          <View className="mt-8 bg-[#1a1a2e] rounded-xl p-4 w-full">
            <View className="flex-row justify-between py-2 border-b border-white/5">
              <Text className="text-gray-500">Build</Text>
              <Text className="text-white">2024.12.001</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-white/5">
              <Text className="text-gray-500">Platform</Text>
              <Text className="text-white">React Native</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-500">Developer</Text>
              <Text className="text-white">Tour Flow Inc.</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function RoleModal({ currentRole, onSelectRole, onClose }: { currentRole: UserRole; onSelectRole: (role: UserRole) => void; onClose: () => void }) {
  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}><X size={24} color="#6b7280" /></Pressable>
          <Text className="text-white text-lg font-semibold">User Role</Text>
          <View className="w-6" />
        </View>
        <ScrollView className="flex-1 px-5 pt-6">
          <Text className="text-gray-500 text-sm mb-4">
            Select your role to control editing permissions and financial visibility.
          </Text>
          <Pressable
            onPress={() => onSelectRole('admin')}
            className={cn(
              "bg-[#1a1a2e] rounded-xl p-4 mb-3 flex-row items-center",
              currentRole === 'admin' && "border border-emerald-500/30"
            )}
          >
            <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
              <Shield size={20} color="#00d4aa" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium">Admin</Text>
              <Text className="text-gray-500 text-sm">Full access to edit and view financials</Text>
            </View>
            {currentRole === 'admin' && (
              <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center">
                <Check size={14} color="#fff" />
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => onSelectRole('user')}
            className={cn(
              "bg-[#1a1a2e] rounded-xl p-4 mb-3 flex-row items-center",
              currentRole === 'user' && "border border-emerald-500/30"
            )}
          >
            <View className="w-10 h-10 rounded-full bg-gray-500/20 items-center justify-center mr-3">
              <User size={20} color="#6b7280" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium">User</Text>
              <Text className="text-gray-500 text-sm">View only, financials hidden</Text>
            </View>
            {currentRole === 'user' && (
              <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center">
                <Check size={14} color="#fff" />
              </View>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function InvitationsModal({
  invitations,
  onClose,
}: {
  invitations: Array<{
    id: string;
    tour_id: string;
    role: 'admin' | 'crew';
    tour: { name: string; artist: string };
  }>;
  onClose: () => void;
}) {
  const { acceptTourInvitation, refreshTourMemberships } = useAuth();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleAccept = async (invitationId: string) => {
    setAcceptingId(invitationId);
    const { error } = await acceptTourInvitation(invitationId);
    setAcceptingId(null);

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshTourMemberships();
    }
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Tour Invitations</Text>
          <View className="w-6" />
        </View>
        <ScrollView className="flex-1 px-5 pt-6">
          {invitations.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Mail size={48} color="#374151" />
              <Text className="text-gray-500 mt-4 text-center">No pending invitations</Text>
            </View>
          ) : (
            invitations.map((invitation) => (
              <View
                key={invitation.id}
                className="bg-[#1a1a2e] rounded-xl p-4 mb-3"
              >
                <View className="flex-row items-start mb-3">
                  <View className="w-12 h-12 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
                    <Music size={20} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{invitation.tour.name}</Text>
                    <Text className="text-gray-400 text-sm">{invitation.tour.artist}</Text>
                    <View className="flex-row items-center mt-1">
                      <View
                        className={cn(
                          'px-2 py-0.5 rounded-full',
                          invitation.role === 'admin' ? 'bg-blue-500/20' : 'bg-emerald-500/20'
                        )}
                      >
                        <Text
                          className={cn(
                            'text-xs font-medium',
                            invitation.role === 'admin' ? 'text-blue-400' : 'text-emerald-400'
                          )}
                        >
                          {invitation.role === 'admin' ? 'Admin' : 'Crew'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleAccept(invitation.id)}
                  disabled={acceptingId === invitation.id}
                  className={cn(
                    'py-3 rounded-xl items-center',
                    acceptingId === invitation.id ? 'bg-emerald-500/50' : 'bg-emerald-500'
                  )}
                >
                  <Text className="text-white font-semibold">
                    {acceptingId === invitation.id ? 'Accepting...' : 'Accept Invitation'}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
