import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  ChevronRight,
  Package,
  Users,
  FileText,
  Zap,
  Radio,
  Volume2,
  CheckCircle2,
  Circle,
  EyeOff,
  Eye,
  Pencil,
  X,
  Plus,
  Trash2,
  Mail,
  UserPlus,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTourFlowStore, type Task } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const tours = useTourFlowStore(s => s.tours);
  const gear = useTourFlowStore(s => s.gear);
  const crew = useTourFlowStore(s => s.crew);
  const tasks = useTourFlowStore(s => s.tasks);
  const documents = useTourFlowStore(s => s.documents);
  const settings = useTourFlowStore(s => s.settings);
  const toggleStealthMode = useTourFlowStore(s => s.toggleStealthMode);
  const canEdit = useTourFlowStore(s => s.canEdit);
  const canViewFinancials = useTourFlowStore(s => s.canViewFinancials);
  const updateTask = useTourFlowStore(s => s.updateTask);
  const deleteTask = useTourFlowStore(s => s.deleteTask);
  const addTask = useTourFlowStore(s => s.addTask);

  // Auth context for pending invitations and tour memberships
  const { pendingInvitations, tourMemberships, acceptTourInvitation, refreshTourMemberships, user, isAuthenticated } = useAuth();

  const [dashboardPressCount, setDashboardPressCount] = useState(0);
  const lastPressTime = useRef(0);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [acceptingInvitation, setAcceptingInvitation] = useState<string | null>(null);

  const activeTour = tours.find(t => t.status === 'upcoming' || t.status === 'active');
  const nextShow = activeTour?.shows.find(s => new Date(s.date) >= new Date());
  const gearIssues = gear.filter(g => g.condition === 'needs_repair' || g.condition === 'fair');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high' || t.priority === 'urgent');

  // Double-tap Dashboard header to toggle Stealth Mode
  const handleDashboardPress = () => {
    const now = Date.now();
    if (now - lastPressTime.current < 300) {
      toggleStealthMode();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDashboardPressCount(0);
    } else {
      setDashboardPressCount(1);
    }
    lastPressTime.current = now;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return 'Past';
    return `${diff} days`;
  };

  const handleTaskPress = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleToggleTaskStatus = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTask(task.id, { status: newStatus });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    setShowTaskModal(false);
    setSelectedTask(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleChangePriority = (task: Task) => {
    const priorities: Task['priority'][] = ['low', 'medium', 'high', 'urgent'];
    const currentIndex = priorities.indexOf(task.priority);
    const newPriority = priorities[(currentIndex + 1) % priorities.length];
    updateTask(task.id, { priority: newPriority });
    setSelectedTask({ ...task, priority: newPriority });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setAcceptingInvitation(invitationId);
    console.log('[Dashboard] Accepting invitation:', invitationId);

    const { error } = await acceptTourInvitation(invitationId);

    if (error) {
      console.log('[Dashboard] Error accepting invitation:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      console.log('[Dashboard] Invitation accepted successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshTourMemberships();
    }

    setAcceptingInvitation(null);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <LinearGradient
        colors={['#0f1419', '#0a0a0f']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            className="px-5 pt-4 pb-6"
          >
            <View className="flex-row items-center justify-between">
              <Pressable onPress={handleDashboardPress}>
                <Text className="text-gray-500 text-sm font-medium tracking-wider uppercase">Tour Flow</Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-white text-2xl font-bold">Dashboard</Text>
                  {settings.stealthMode && (
                    <View className="ml-2 bg-amber-500/20 px-2 py-0.5 rounded-full flex-row items-center">
                      <EyeOff size={12} color="#f59e0b" />
                      <Text className="text-amber-400 text-xs ml-1">Stealth</Text>
                    </View>
                  )}
                </View>
              </Pressable>
              <View className="flex-row items-center gap-2">
                <Pressable
                  className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                  onPress={() => {
                    toggleStealthMode();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  {settings.stealthMode ? (
                    <Eye size={20} color="#f59e0b" />
                  ) : (
                    <EyeOff size={20} color="#6b7280" />
                  )}
                </Pressable>
                <Pressable
                  className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                  onPress={() => router.push('/assistant')}
                >
                  <Zap size={20} color="#00d4aa" />
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(150).duration(600)}
              className="mx-5 mb-6"
            >
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Tour Invitations</Text>
              <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl overflow-hidden">
                {pendingInvitations.map((invitation, index) => (
                  <View
                    key={invitation.id}
                    className={cn(
                      'p-4',
                      index < pendingInvitations.length - 1 && 'border-b border-blue-500/10'
                    )}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Mail size={14} color="#3b82f6" />
                          <Text className="text-blue-400 text-xs font-medium ml-1.5 uppercase">
                            {invitation.role === 'admin' ? 'Admin Invite' : 'Crew Invite'}
                          </Text>
                        </View>
                        <Text className="text-white font-bold">{invitation.tour.name}</Text>
                        <Text className="text-gray-400 text-sm">{invitation.tour.artist}</Text>
                      </View>
                      <Pressable
                        onPress={() => handleAcceptInvitation(invitation.id)}
                        disabled={acceptingInvitation === invitation.id}
                        className={cn(
                          'py-2 px-4 rounded-lg flex-row items-center',
                          acceptingInvitation === invitation.id ? 'bg-emerald-500/30' : 'bg-emerald-500'
                        )}
                      >
                        {acceptingInvitation === invitation.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <UserPlus size={14} color="#fff" />
                            <Text className="text-white font-medium text-sm ml-1.5">Join</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Empty State for New Users */}
          {isAuthenticated && tourMemberships.length === 0 && pendingInvitations.length === 0 && tours.length === 0 && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              className="mx-5 mb-6"
            >
              <View className="bg-[#1a1a2e] rounded-xl p-8 items-center">
                <View className="w-20 h-20 rounded-full bg-emerald-500/20 items-center justify-center mb-4">
                  <Users size={36} color="#00d4aa" />
                </View>
                <Text className="text-white text-xl font-bold text-center mb-2">Welcome to Tour Flow</Text>
                <Text className="text-gray-400 text-center mb-6">
                  You haven't been invited to any tours yet. Wait for an admin to invite you, or create your own tour to get started.
                </Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/tours');
                  }}
                  className="bg-emerald-500 py-3 px-6 rounded-xl flex-row items-center"
                >
                  <Plus size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Create Your First Tour</Text>
                </Pressable>
                <Text className="text-gray-500 text-xs text-center mt-4">
                  Creating a tour makes you its admin automatically
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Your Tours (from Supabase memberships) */}
          {isAuthenticated && tourMemberships.length > 0 && !activeTour && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              className="mx-5 mb-6"
            >
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Your Tours</Text>
              {tourMemberships.map((membership) => (
                <Pressable
                  key={membership.tour_id}
                  onPress={() => router.push('/tours')}
                  className="mb-2"
                >
                  <LinearGradient
                    colors={['#1a1a2e', '#16213e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16, padding: 16 }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View className={cn(
                          'px-2 py-0.5 rounded-full mr-2',
                          membership.role === 'admin' ? 'bg-blue-500/20' : 'bg-emerald-500/20'
                        )}>
                          <Text className={cn(
                            'text-xs font-medium uppercase',
                            membership.role === 'admin' ? 'text-blue-400' : 'text-emerald-400'
                          )}>
                            {membership.role}
                          </Text>
                        </View>
                        {!membership.can_view_financials && membership.role !== 'admin' && (
                          <View className="bg-gray-500/20 px-2 py-0.5 rounded-full">
                            <Text className="text-gray-400 text-xs">No Financials</Text>
                          </View>
                        )}
                      </View>
                      <ChevronRight size={18} color="#6b7280" />
                    </View>
                    <Text className="text-white text-lg font-bold">{membership.tour.name}</Text>
                    <Text className="text-gray-400 text-sm">{membership.tour.artist}</Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* Active Tour Card */}
          {activeTour && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              className="mx-5 mb-6"
            >
              <Pressable onPress={() => router.push('/tours')}>
                <LinearGradient
                  colors={['#1a1a2e', '#16213e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 20 }}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                      <Text className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Active Tour</Text>
                    </View>
                    <ChevronRight size={18} color="#6b7280" />
                  </View>

                  <Text className="text-white text-xl font-bold mb-1">{activeTour.name}</Text>
                  <Text className="text-gray-400 text-sm mb-4">{activeTour.artist}</Text>

                  <View className="flex-row items-center space-x-4">
                    <View className="flex-row items-center">
                      <Calendar size={14} color="#9ca3af" />
                      <Text className="text-gray-400 text-sm ml-2">{activeTour.shows.length} shows</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Users size={14} color="#9ca3af" />
                      <Text className="text-gray-400 text-sm ml-2">{crew.length} crew</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Next Show Card */}
          {nextShow && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(600)}
              className="mx-5 mb-6"
            >
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Next Show</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({
                    pathname: '/show-detail',
                    params: { showId: nextShow.id, tourId: activeTour?.id },
                  });
                }}
              >
                <LinearGradient
                  colors={['#00d4aa15', '#00d4aa05']}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#00d4aa30',
                  }}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold">{nextShow.venue}</Text>
                      <View className="flex-row items-center mt-1">
                        <MapPin size={12} color="#9ca3af" />
                        <Text className="text-gray-400 text-sm ml-1">{nextShow.city}, {nextShow.state}</Text>
                      </View>
                    </View>
                    <View className="bg-emerald-400/20 px-3 py-1.5 rounded-full">
                      <Text className="text-emerald-400 text-xs font-bold">{daysUntil(nextShow.date)}</Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-3 mt-2">
                    <View className="flex-row items-center bg-white/5 px-3 py-2 rounded-lg">
                      <Calendar size={14} color="#00d4aa" />
                      <Text className="text-gray-300 text-sm ml-2">{formatDate(nextShow.date)}</Text>
                    </View>
                    <View className="flex-row items-center bg-white/5 px-3 py-2 rounded-lg">
                      <Clock size={14} color="#00d4aa" />
                      <Text className="text-gray-300 text-sm ml-2">Load: {nextShow.loadIn}</Text>
                    </View>
                    <View className="flex-row items-center bg-white/5 px-3 py-2 rounded-lg">
                      <Volume2 size={14} color="#00d4aa" />
                      <Text className="text-gray-300 text-sm ml-2">SC: {nextShow.soundcheck}</Text>
                    </View>
                    <View className="flex-row items-center bg-white/5 px-3 py-2 rounded-lg">
                      <Radio size={14} color="#00d4aa" />
                      <Text className="text-gray-300 text-sm ml-2">Show: {nextShow.showTime}</Text>
                    </View>
                  </View>

                  {nextShow.notes && (
                    <View className="mt-3 pt-3 border-t border-white/10">
                      <Text className="text-gray-500 text-xs">{nextShow.notes}</Text>
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Quick Stats */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            className="mx-5 mb-6"
          >
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Quick Stats</Text>
            <View className="flex-row flex-wrap gap-3">
              <Pressable
                className="flex-1 min-w-[45%]"
                onPress={() => router.push('/gear')}
              >
                <View className="bg-[#1a1a2e] rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Package size={18} color="#8b5cf6" />
                    {gearIssues.length > 0 && (
                      <View className="bg-amber-500/20 px-2 py-0.5 rounded-full">
                        <Text className="text-amber-400 text-xs">{gearIssues.length} issues</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-white text-2xl font-bold">{gear.length}</Text>
                  <Text className="text-gray-500 text-sm">Gear Items</Text>
                </View>
              </Pressable>

              <Pressable
                className="flex-1 min-w-[45%]"
                onPress={() => router.push('/documents')}
              >
                <View className="bg-[#1a1a2e] rounded-xl p-4">
                  <FileText size={18} color="#3b82f6" />
                  <Text className="text-white text-2xl font-bold mt-2">{documents.length}</Text>
                  <Text className="text-gray-500 text-sm">Documents</Text>
                </View>
              </Pressable>

              <Pressable
                className="flex-1 min-w-[45%]"
                onPress={() => router.push('/crew')}
              >
                <View className="bg-[#1a1a2e] rounded-xl p-4">
                  <Users size={18} color="#f59e0b" />
                  <Text className="text-white text-2xl font-bold mt-2">{crew.length}</Text>
                  <Text className="text-gray-500 text-sm">Crew Members</Text>
                </View>
              </Pressable>

              <Pressable
                className="flex-1 min-w-[45%]"
                onPress={() => setShowAddTaskModal(true)}
              >
                <View className="bg-[#1a1a2e] rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <AlertCircle size={18} color="#ef4444" />
                    {highPriorityTasks.length > 0 && (
                      <View className="bg-red-500/20 px-2 py-0.5 rounded-full">
                        <Text className="text-red-400 text-xs">{highPriorityTasks.length} urgent</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-white text-2xl font-bold">{pendingTasks.length}</Text>
                  <Text className="text-gray-500 text-sm">Open Tasks</Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>

          {/* Tasks Preview */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(600)}
            className="mx-5 mb-6"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Priority Tasks</Text>
              <Pressable onPress={() => setShowAddTaskModal(true)}>
                <Text className="text-emerald-400 text-xs font-medium">View All</Text>
              </Pressable>
            </View>

            <View className="bg-[#1a1a2e] rounded-xl overflow-hidden">
              {pendingTasks.slice(0, 4).map((task, index) => {
                const assignee = crew.find(c => c.id === task.assignee);
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => handleTaskPress(task)}
                    className={cn(
                      "flex-row items-center p-4",
                      index < pendingTasks.slice(0, 4).length - 1 && "border-b border-white/5"
                    )}
                  >
                    <Pressable
                      onPress={() => handleToggleTaskStatus(task)}
                      className={cn(
                        "w-6 h-6 rounded-full items-center justify-center mr-3",
                        task.priority === 'urgent' && "bg-red-500/20",
                        task.priority === 'high' && "bg-amber-500/20",
                        task.priority === 'medium' && "bg-blue-500/20",
                        task.priority === 'low' && "bg-gray-500/20",
                      )}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 size={14} color="#00d4aa" />
                      ) : (
                        <Circle size={14} color={
                          task.priority === 'urgent' ? '#ef4444' :
                          task.priority === 'high' ? '#f59e0b' :
                          task.priority === 'medium' ? '#3b82f6' : '#6b7280'
                        } />
                      )}
                    </Pressable>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-medium">{task.title}</Text>
                      {assignee && (
                        <Text className="text-gray-500 text-xs mt-0.5">{assignee.name}</Text>
                      )}
                    </View>
                    {task.dueDate && (
                      <Text className="text-gray-500 text-xs">{formatDate(task.dueDate)}</Text>
                    )}
                    {canEdit() && (
                      <Pencil size={12} color="#6b7280" className="ml-2" />
                    )}
                  </Pressable>
                );
              })}
              {pendingTasks.length === 0 && (
                <View className="p-4 items-center">
                  <Text className="text-gray-500 text-sm">No pending tasks</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Gear Alerts */}
          {gearIssues.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(600).duration(600)}
              className="mx-5 mb-6"
            >
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Gear Alerts</Text>
              <Pressable onPress={() => router.push('/gear')}>
                <View className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  {gearIssues.slice(0, 3).map((item, index) => (
                    <View
                      key={item.id}
                      className={cn(
                        "flex-row items-center",
                        index < gearIssues.slice(0, 3).length - 1 && "mb-3 pb-3 border-b border-amber-500/10"
                      )}
                    >
                      <AlertCircle size={16} color="#f59e0b" />
                      <View className="flex-1 ml-3">
                        <Text className="text-white text-sm font-medium">{item.name}</Text>
                        <Text className="text-amber-400/80 text-xs">{item.notes}</Text>
                      </View>
                      <View className={cn(
                        "px-2 py-1 rounded-full",
                        item.condition === 'needs_repair' ? "bg-red-500/20" : "bg-amber-500/20"
                      )}>
                        <Text className={cn(
                          "text-xs capitalize",
                          item.condition === 'needs_repair' ? "text-red-400" : "text-amber-400"
                        )}>
                          {item.condition.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* AI Quick Actions */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(600)}
            className="mx-5 mb-8"
          >
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">AI Assistant</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
            >
              <View className="flex-row gap-3">
                {[
                  { label: 'Generate Day Sheet', icon: FileText },
                  { label: 'Parse Input List', icon: Radio },
                  { label: 'Check RF Coords', icon: Zap },
                  { label: 'Mixing Tips', icon: Volume2 },
                ].map((action, index) => (
                  <Pressable
                    key={index}
                    onPress={() => router.push('/assistant')}
                    className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex-row items-center"
                  >
                    <action.icon size={16} color="#00d4aa" />
                    <Text className="text-emerald-400 text-sm font-medium ml-2">{action.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Animated.View>

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>

      {/* Task Detail/Edit Modal */}
      <Modal
        visible={showTaskModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTaskModal(false)}
      >
        <TaskDetailModal
          task={selectedTask}
          crew={crew}
          canEdit={canEdit()}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onToggleStatus={() => selectedTask && handleToggleTaskStatus(selectedTask)}
          onChangePriority={() => selectedTask && handleChangePriority(selectedTask)}
          onDelete={() => selectedTask && handleDeleteTask(selectedTask.id)}
        />
      </Modal>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTaskModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddTaskModal(false)}
      >
        <AddTaskModal
          tasks={tasks}
          crew={crew}
          onClose={() => setShowAddTaskModal(false)}
          onAdd={(task) => {
            addTask(task);
            setShowAddTaskModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      </Modal>
    </View>
  );
}

function TaskDetailModal({
  task,
  crew,
  canEdit,
  onClose,
  onToggleStatus,
  onChangePriority,
  onDelete,
}: {
  task: Task | null;
  crew: { id: string; name: string }[];
  canEdit: boolean;
  onClose: () => void;
  onToggleStatus: () => void;
  onChangePriority: () => void;
  onDelete: () => void;
}) {
  if (!task) return null;

  const assignee = crew.find(c => c.id === task.assignee);
  const priorityColors = {
    urgent: '#ef4444',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#6b7280',
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Task Details</Text>
          {canEdit && (
            <Pressable onPress={onDelete}>
              <Trash2 size={20} color="#ef4444" />
            </Pressable>
          )}
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <Text className="text-white text-xl font-bold mb-2">{task.title}</Text>
          {task.description && (
            <Text className="text-gray-400 text-base mb-4">{task.description}</Text>
          )}

          <View className="flex-row gap-3 mb-6">
            <Pressable
              onPress={canEdit ? onChangePriority : undefined}
              className="flex-1 bg-[#1a1a2e] p-4 rounded-xl"
            >
              <Text className="text-gray-500 text-xs mb-1">Priority</Text>
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: priorityColors[task.priority] }}
                />
                <Text className="text-white font-medium capitalize">{task.priority}</Text>
                {canEdit && <Pencil size={12} color="#6b7280" className="ml-2" />}
              </View>
            </Pressable>

            <Pressable
              onPress={canEdit ? onToggleStatus : undefined}
              className="flex-1 bg-[#1a1a2e] p-4 rounded-xl"
            >
              <Text className="text-gray-500 text-xs mb-1">Status</Text>
              <Text className={cn(
                "font-medium capitalize",
                task.status === 'completed' ? "text-emerald-400" : "text-white"
              )}>
                {task.status.replace('_', ' ')}
              </Text>
            </Pressable>
          </View>

          {assignee && (
            <View className="bg-[#1a1a2e] p-4 rounded-xl mb-4">
              <Text className="text-gray-500 text-xs mb-1">Assigned To</Text>
              <Text className="text-white font-medium">{assignee.name}</Text>
            </View>
          )}

          {task.dueDate && (
            <View className="bg-[#1a1a2e] p-4 rounded-xl mb-4">
              <Text className="text-gray-500 text-xs mb-1">Due Date</Text>
              <Text className="text-white font-medium">
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          {canEdit && (
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={onToggleStatus}
                className={cn(
                  "flex-1 py-3 rounded-xl items-center",
                  task.status === 'completed' ? "bg-gray-500/20" : "bg-emerald-500"
                )}
              >
                <Text className={cn(
                  "font-semibold",
                  task.status === 'completed' ? "text-gray-400" : "text-white"
                )}>
                  {task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AddTaskModal({
  tasks,
  crew,
  onClose,
  onAdd,
}: {
  tasks: Task[];
  crew: { id: string; name: string }[];
  onClose: () => void;
  onAdd: (task: Task) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [assignee, setAssignee] = useState<string | undefined>();

  const handleAdd = () => {
    if (!title.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'pending',
      assignee,
    };

    onAdd(task);
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Tasks</Text>
          <Pressable onPress={handleAdd} disabled={!title.trim()}>
            <Plus size={24} color={title.trim() ? "#00d4aa" : "#6b7280"} />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Add New Task Section */}
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Add New Task</Text>
          <View className="mb-5">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Task title..."
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base mb-3"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#4b5563"
              multiline
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[60px]"
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Priority</Text>
            <View className="flex-row gap-2">
              {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  className={cn(
                    "flex-1 py-2 rounded-lg items-center",
                    priority === p ? "bg-emerald-500" : "bg-[#1a1a2e]"
                  )}
                >
                  <Text className={cn(
                    "text-sm capitalize",
                    priority === p ? "text-white font-medium" : "text-gray-400"
                  )}>
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* All Tasks List */}
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 mt-6">
            All Tasks ({pendingTasks.length} pending)
          </Text>
          {pendingTasks.map((task) => {
            const taskAssignee = crew.find(c => c.id === task.assignee);
            return (
              <View
                key={task.id}
                className="bg-[#1a1a2e] rounded-xl p-4 mb-2 flex-row items-center"
              >
                <View className={cn(
                  "w-3 h-3 rounded-full mr-3",
                  task.priority === 'urgent' && "bg-red-500",
                  task.priority === 'high' && "bg-amber-500",
                  task.priority === 'medium' && "bg-blue-500",
                  task.priority === 'low' && "bg-gray-500",
                )} />
                <View className="flex-1">
                  <Text className="text-white font-medium">{task.title}</Text>
                  {taskAssignee && (
                    <Text className="text-gray-500 text-xs mt-0.5">{taskAssignee.name}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
