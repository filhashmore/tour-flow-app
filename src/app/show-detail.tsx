import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Mail,
  Users,
  Calendar,
  FileText,
  ListMusic,
  LayoutGrid,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronRight,
  Share2,
  Download,
  Truck,
  Volume2,
  DoorOpen,
  Music,
  LogOut,
  Zap,
  Radio,
  Building,
  DollarSign,
  Plus
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTourFlowStore, type Task } from '@/lib/store';
import { cn } from '@/lib/cn';

type SectionId = 'timeline' | 'contacts' | 'tasks' | 'input_list' | 'stage_plot' | 'notes' | 'settlement';

export default function ShowDetailScreen() {
  const router = useRouter();
  const { showId, tourId } = useLocalSearchParams<{ showId: string; tourId: string }>();

  const tours = useTourFlowStore(s => s.tours);
  const tasks = useTourFlowStore(s => s.tasks);
  const inputList = useTourFlowStore(s => s.inputList);
  const updateTask = useTourFlowStore(s => s.updateTask);
  const addTask = useTourFlowStore(s => s.addTask);

  const [activeSection, setActiveSection] = useState<SectionId>('timeline');

  const tour = tours.find(t => t.id === tourId);
  const show = tour?.shows.find(s => s.id === showId);
  const showTasks = tasks.filter(t => t.showId === showId);

  if (!show || !tour) {
    return (
      <View className="flex-1 bg-[#0a0a0f] items-center justify-center">
        <Text className="text-gray-500">Show not found</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  // Timeline events
  const timelineEvents = [
    { time: show.loadIn, label: 'Load In', icon: Truck, color: '#6b7280', description: 'Crew call, start unloading gear' },
    { time: show.soundcheck, label: 'Soundcheck', icon: Volume2, color: '#3b82f6', description: 'Full band soundcheck' },
    { time: show.doors, label: 'Doors', icon: DoorOpen, color: '#f59e0b', description: 'Venue opens to public' },
    { time: show.showTime, label: 'Show Time', icon: Music, color: '#00d4aa', description: 'Performance begins' },
    { time: show.curfew, label: 'Curfew', icon: LogOut, color: '#ef4444', description: 'Hard out, load out begins' },
  ];

  const sections: { id: SectionId; label: string; icon: React.ComponentType<{size: number; color: string}> }[] = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'contacts', label: 'Contacts', icon: Phone },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { id: 'input_list', label: 'Input List', icon: ListMusic },
    { id: 'stage_plot', label: 'Stage Plot', icon: LayoutGrid },
    { id: 'settlement', label: 'Settlement', icon: DollarSign },
  ];

  const generateDaySheet = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/assistant',
    });
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTask(task.id, { status: newStatus });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addNewTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'New task',
      description: '',
      status: 'pending',
      priority: 'medium',
      tourId: tour.id,
      showId: show.id,
    };
    addTask(newTask);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <LinearGradient
        colors={['#16213e', '#0a0a0f']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center"
            >
              <ArrowLeft size={20} color="#00d4aa" />
              <Text className="text-emerald-400 ml-2">Calendar</Text>
            </Pressable>
            <Pressable
              onPress={generateDaySheet}
              className="bg-emerald-500 px-4 py-2 rounded-full flex-row items-center"
            >
              <FileText size={14} color="#fff" />
              <Text className="text-white font-semibold ml-2">Day Sheet</Text>
            </Pressable>
          </View>

          {/* Show Header */}
          <View className="mb-4">
            <Text className="text-white text-2xl font-bold">{show.venue}</Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={14} color="#6b7280" />
              <Text className="text-gray-400 ml-1">{show.city}, {show.state}</Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Calendar size={14} color="#00d4aa" />
              <Text className="text-emerald-400 ml-1 font-medium">{formatDate(show.date)}</Text>
            </View>
          </View>

          {/* Section Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
          >
            <View className="flex-row gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Pressable
                    key={section.id}
                    onPress={() => {
                      setActiveSection(section.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full flex-row items-center",
                      activeSection === section.id ? "bg-emerald-500" : "bg-[#1a1a2e]"
                    )}
                  >
                    <Icon size={14} color={activeSection === section.id ? "#fff" : "#6b7280"} />
                    <Text className={cn(
                      "text-sm font-medium ml-2",
                      activeSection === section.id ? "text-white" : "text-gray-400"
                    )}>
                      {section.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Timeline Section */}
          {activeSection === 'timeline' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">Show Timeline</Text>

              {timelineEvents.map((event, index) => (
                <Animated.View
                  key={event.label}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                  className="flex-row mb-4"
                >
                  {/* Timeline Line */}
                  <View className="items-center mr-4">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${event.color}20` }}
                    >
                      <event.icon size={18} color={event.color} />
                    </View>
                    {index < timelineEvents.length - 1 && (
                      <View className="w-0.5 flex-1 bg-white/10 mt-2" />
                    )}
                  </View>

                  {/* Event Content */}
                  <View className="flex-1 pb-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-white font-bold text-lg">{event.label}</Text>
                      <Text className="text-2xl font-bold" style={{ color: event.color }}>{event.time}</Text>
                    </View>
                    <Text className="text-gray-500 text-sm mt-1">{event.description}</Text>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Contacts Section */}
          {activeSection === 'contacts' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">Venue Contacts</Text>

              <View className="bg-[#1a1a2e] rounded-xl overflow-hidden mb-4">
                <View className="p-4 border-b border-white/5">
                  <Text className="text-gray-500 text-xs uppercase mb-1">Production Manager</Text>
                  <Text className="text-white font-bold text-lg">{show.venueContact}</Text>
                </View>

                <Pressable
                  onPress={() => Linking.openURL(`tel:${show.venuePhone}`)}
                  className="p-4 border-b border-white/5 flex-row items-center"
                >
                  <Phone size={18} color="#00d4aa" />
                  <Text className="text-gray-300 ml-3 flex-1">{show.venuePhone}</Text>
                  <ChevronRight size={16} color="#6b7280" />
                </Pressable>

                <Pressable
                  onPress={() => Linking.openURL(`mailto:${show.venueEmail}`)}
                  className="p-4 flex-row items-center"
                >
                  <Mail size={18} color="#00d4aa" />
                  <Text className="text-gray-300 ml-3 flex-1">{show.venueEmail}</Text>
                  <ChevronRight size={16} color="#6b7280" />
                </Pressable>
              </View>

              <View className="bg-[#1a1a2e] rounded-xl p-4">
                <View className="flex-row items-center mb-3">
                  <Building size={18} color="#6b7280" />
                  <Text className="text-gray-500 ml-2 text-sm">Venue Capacity</Text>
                </View>
                <Text className="text-white text-3xl font-bold">{show.capacity?.toLocaleString()}</Text>
              </View>
            </Animated.View>
          )}

          {/* Tasks Section */}
          {activeSection === 'tasks' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Show Tasks</Text>
                <Pressable
                  onPress={addNewTask}
                  className="bg-emerald-500/20 px-3 py-1.5 rounded-full flex-row items-center"
                >
                  <Plus size={14} color="#00d4aa" />
                  <Text className="text-emerald-400 text-sm ml-1">Add Task</Text>
                </Pressable>
              </View>

              {showTasks.length === 0 ? (
                <View className="bg-[#1a1a2e] rounded-xl p-8 items-center">
                  <CheckCircle2 size={32} color="#374151" />
                  <Text className="text-gray-500 mt-3">No tasks for this show</Text>
                </View>
              ) : (
                showTasks.map((task, index) => (
                  <Animated.View
                    key={task.id}
                    entering={FadeInDown.delay(index * 30).duration(200)}
                  >
                    <Pressable
                      onPress={() => toggleTaskStatus(task)}
                      className="bg-[#1a1a2e] rounded-xl p-4 mb-2 flex-row items-center"
                    >
                      <View className={cn(
                        "w-6 h-6 rounded-full items-center justify-center mr-3",
                        task.status === 'completed' ? "bg-emerald-500" : "bg-white/10"
                      )}>
                        {task.status === 'completed' ? (
                          <CheckCircle2 size={16} color="#fff" />
                        ) : (
                          <Circle size={16} color="#6b7280" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className={cn(
                          "font-medium",
                          task.status === 'completed' ? "text-gray-500 line-through" : "text-white"
                        )}>
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text className="text-gray-500 text-sm mt-0.5">{task.description}</Text>
                        )}
                      </View>
                      <View className={cn(
                        "px-2 py-1 rounded-full",
                        task.priority === 'urgent' && "bg-red-500/20",
                        task.priority === 'high' && "bg-amber-500/20",
                        task.priority === 'medium' && "bg-blue-500/20",
                        task.priority === 'low' && "bg-gray-500/20",
                      )}>
                        <Text className={cn(
                          "text-xs capitalize",
                          task.priority === 'urgent' && "text-red-400",
                          task.priority === 'high' && "text-amber-400",
                          task.priority === 'medium' && "text-blue-400",
                          task.priority === 'low' && "text-gray-400",
                        )}>
                          {task.priority}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))
              )}
            </Animated.View>
          )}

          {/* Input List Section */}
          {activeSection === 'input_list' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Input List</Text>
                <Text className="text-gray-500 text-xs">{inputList.length} channels</Text>
              </View>

              <View className="bg-[#1a1a2e] rounded-xl overflow-hidden">
                {/* Header */}
                <View className="flex-row bg-white/5 px-3 py-2">
                  <Text className="text-gray-500 text-xs font-semibold w-8">CH</Text>
                  <Text className="text-gray-500 text-xs font-semibold flex-1">SOURCE</Text>
                  <Text className="text-gray-500 text-xs font-semibold w-20">MIC</Text>
                </View>

                {inputList.slice(0, 12).map((channel, index) => (
                  <View
                    key={channel.channel}
                    className={cn(
                      "flex-row items-center px-3 py-2",
                      index % 2 === 0 ? "bg-white/[0.02]" : ""
                    )}
                  >
                    <View className="w-8">
                      <View className="bg-emerald-500/20 w-6 h-6 rounded items-center justify-center">
                        <Text className="text-emerald-400 text-xs font-bold">{channel.channel}</Text>
                      </View>
                    </View>
                    <Text className="text-white flex-1 text-sm">{channel.source}</Text>
                    <Text className="text-gray-400 text-sm w-20" numberOfLines={1}>{channel.mic}</Text>
                  </View>
                ))}

                {inputList.length > 12 && (
                  <Pressable
                    onPress={() => router.push('/documents')}
                    className="p-3 border-t border-white/5 flex-row items-center justify-center"
                  >
                    <Text className="text-emerald-400 text-sm">View all {inputList.length} channels</Text>
                    <ChevronRight size={14} color="#00d4aa" />
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}

          {/* Stage Plot Section */}
          {activeSection === 'stage_plot' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">Stage Plot</Text>

              <View className="bg-[#1a1a2e] rounded-xl p-4 aspect-video items-center justify-center border border-white/10">
                <LayoutGrid size={48} color="#374151" />
                <Text className="text-gray-500 mt-4 text-center">Stage plot visualization</Text>
                <Text className="text-gray-600 text-sm text-center mt-1">Tap to view full plot</Text>
              </View>

              <View className="mt-4 bg-white/5 rounded-xl p-4">
                <Text className="text-gray-500 text-xs uppercase mb-2">Stage Requirements</Text>
                <Text className="text-gray-300 text-sm">Minimum 32' x 24' stage</Text>
                <Text className="text-gray-300 text-sm mt-1">IEM rack upstage left</Text>
                <Text className="text-gray-300 text-sm mt-1">FOH at 75-100ft from stage</Text>
              </View>
            </Animated.View>
          )}

          {/* Settlement Section */}
          {activeSection === 'settlement' && show.settlement && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">Settlement</Text>

              <View className="bg-[#1a1a2e] rounded-xl p-4">
                <View className="flex-row justify-between mb-3 pb-3 border-b border-white/10">
                  <Text className="text-gray-400">Guarantee</Text>
                  <Text className="text-white font-medium">{formatCurrency(show.settlement.guarantee)}</Text>
                </View>
                <View className="flex-row justify-between mb-3 pb-3 border-b border-white/10">
                  <Text className="text-gray-400">Bonus</Text>
                  <Text className="text-emerald-400 font-medium">+{formatCurrency(show.settlement.bonus)}</Text>
                </View>
                <View className="flex-row justify-between mb-3 pb-3 border-b border-white/10">
                  <Text className="text-gray-400">Merch</Text>
                  <Text className="text-white font-medium">{formatCurrency(show.settlement.merch)}</Text>
                </View>
                <View className="flex-row justify-between mb-3 pb-3 border-b border-white/10">
                  <Text className="text-gray-400">Expenses</Text>
                  <Text className="text-red-400 font-medium">-{formatCurrency(show.settlement.expenses)}</Text>
                </View>
                <View className="flex-row justify-between mb-3 pb-3 border-b border-white/10">
                  <Text className="text-gray-400">Per Diem</Text>
                  <Text className="text-white font-medium">{formatCurrency(show.settlement.perDiem)}</Text>
                </View>
                <View className="flex-row justify-between pt-2">
                  <Text className="text-white font-bold text-lg">Net Total</Text>
                  <Text className="text-emerald-400 font-bold text-2xl">{formatCurrency(show.settlement.total)}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {activeSection === 'settlement' && !show.settlement && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View className="bg-[#1a1a2e] rounded-xl p-8 items-center">
                <DollarSign size={32} color="#374151" />
                <Text className="text-gray-500 mt-3">No settlement data yet</Text>
              </View>
            </Animated.View>
          )}

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
