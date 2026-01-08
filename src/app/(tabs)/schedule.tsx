import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  Mic,
  DoorOpen,
  Music,
  LogOut,
  Bus,
  MapPin,
  Users,
  Coffee,
  Copy,
  CalendarDays,
  Navigation,
  Clock,
  Pencil,
  X,
  Save,
  Share2,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useTourFlowStore, type Show } from '@/lib/store';
import { cn } from '@/lib/cn';

type TimelineEvent = {
  id: string;
  type: 'load_in' | 'soundcheck' | 'catering' | 'doors' | 'support' | 'show' | 'curfew' | 'bus_call' | 'travel';
  time: string;
  label: string;
  notes?: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  editable?: boolean;
  field?: keyof Show;
};

// Travel info is calculated dynamically based on actual show IDs
// No hardcoded sample show IDs
const TRAVEL_INFO: Record<string, { distance: string; duration: string; timezone?: string }> = {};

export default function ScheduleScreen() {
  const router = useRouter();
  const tours = useTourFlowStore(s => s.tours);
  const inputList = useTourFlowStore(s => s.inputList);
  const canEdit = useTourFlowStore(s => s.canEdit);
  const updateShow = useTourFlowStore(s => s.updateShow);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeTour = tours.find(t => t.status === 'upcoming' || t.status === 'active');

  const upcomingShows = useMemo(() => {
    if (!activeTour) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return activeTour.shows
      .filter(show => new Date(show.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activeTour]);

  const [selectedShowIndex, setSelectedShowIndex] = useState(0);
  const selectedShow = upcomingShows[selectedShowIndex];
  const previousShow = selectedShowIndex > 0 ? upcomingShows[selectedShowIndex - 1] : null;

  // Get travel info to this show
  const travelInfo = previousShow
    ? TRAVEL_INFO[`${previousShow.id}-${selectedShow?.id}`]
    : null;

  // Generate timeline events
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    if (!selectedShow) return [];

    const events: TimelineEvent[] = [];

    // Travel from previous show
    if (travelInfo) {
      events.push({
        id: 'travel',
        type: 'travel',
        time: '',
        label: `Travel from ${previousShow?.city}`,
        notes: `${travelInfo.distance} · ${travelInfo.duration}${travelInfo.timezone ? ` · ${travelInfo.timezone}` : ''}`,
        icon: Navigation,
        color: '#6b7280',
      });
    }

    events.push(
      { id: '1', type: 'load_in', time: selectedShow.loadIn, label: 'Load In', notes: 'Crew call, truck unload', icon: Truck, color: '#6b7280', editable: true, field: 'loadIn' },
      { id: '2', type: 'soundcheck', time: selectedShow.soundcheck, label: 'Soundcheck', notes: 'Full band line check', icon: Mic, color: '#3b82f6', editable: true, field: 'soundcheck' },
      { id: '3', type: 'catering', time: addHours(selectedShow.soundcheck, 2), label: 'Dinner', notes: 'Crew catering', icon: Coffee, color: '#ec4899' },
      { id: '4', type: 'doors', time: selectedShow.doors, label: 'Doors', notes: 'House opens', icon: DoorOpen, color: '#8b5cf6', editable: true, field: 'doors' },
      { id: '5', type: 'show', time: selectedShow.showTime, label: 'Show', notes: 'Downbeat', icon: Music, color: '#22c55e', editable: true, field: 'showTime' },
      { id: '6', type: 'curfew', time: selectedShow.curfew, label: 'Curfew', notes: 'Hard out', icon: LogOut, color: '#ef4444', editable: true, field: 'curfew' },
      { id: '7', type: 'bus_call', time: addHours(selectedShow.curfew, 1.5), label: 'Bus Call', notes: 'Wheels rolling', icon: Bus, color: '#f59e0b' },
    );

    return events;
  }, [selectedShow, travelInfo, previousShow]);

  const goToPrevShow = () => {
    if (selectedShowIndex > 0) {
      setSelectedShowIndex(selectedShowIndex - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const goToNextShow = () => {
    if (selectedShowIndex < upcomingShows.length - 1) {
      setSelectedShowIndex(selectedShowIndex + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const copySchedule = async () => {
    if (!selectedShow || !activeTour) return;

    const scheduleText = `
${activeTour.artist.toUpperCase()} · ${activeTour.name}
${selectedShow.venue} · ${selectedShow.city}, ${selectedShow.state}
${new Date(selectedShow.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

SCHEDULE
Load In ........... ${selectedShow.loadIn}
Soundcheck ........ ${selectedShow.soundcheck}
Doors ............. ${selectedShow.doors}
Show .............. ${selectedShow.showTime}
Curfew ............ ${selectedShow.curfew}

${selectedShow.notes ? `NOTES\n${selectedShow.notes}\n` : ''}
Generated by Tour Flow
`.trim();

    await Clipboard.setStringAsync(scheduleText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const shareSchedule = async () => {
    if (!selectedShow || !activeTour) return;

    const scheduleText = `${activeTour.artist.toUpperCase()} · ${activeTour.name}
${selectedShow.venue} · ${selectedShow.city}, ${selectedShow.state}
${new Date(selectedShow.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

SCHEDULE
Load In ........... ${selectedShow.loadIn}
Soundcheck ........ ${selectedShow.soundcheck}
Doors ............. ${selectedShow.doors}
Show .............. ${selectedShow.showTime}
Curfew ............ ${selectedShow.curfew}
${selectedShow.notes ? `\nNOTES\n${selectedShow.notes}\n` : ''}
Shared via Tour Flow`;

    try {
      await Share.share({
        message: scheduleText,
        title: `${selectedShow.venue} Schedule`,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // User cancelled
    }
  };

  const copyPublicLink = async () => {
    if (!selectedShow || !activeTour) return;

    // Generate a mock public link (in production this would be an actual URL)
    const publicLink = `https://tourflow.app/schedule/${activeTour.id}/${selectedShow.id}`;
    await Clipboard.setStringAsync(publicLink);
    setCopiedLink(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Reset copied state after 2 seconds
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
      full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  };

  if (!activeTour || upcomingShows.length === 0) {
    return (
      <View className="flex-1 bg-[#0a0a0a]">
        <SafeAreaView edges={['top']} className="flex-1 items-center justify-center">
          <Clock size={40} color="#333" />
          <Text className="text-gray-600 mt-3 text-sm">No upcoming shows</Text>
        </SafeAreaView>
      </View>
    );
  }

  const dateInfo = formatDate(selectedShow.date);

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold">Schedule</Text>
          <View className="flex-row items-center gap-2">
            {canEdit() && (
              <Pressable
                onPress={() => {
                  setShowEditModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="w-9 h-9 rounded-full bg-emerald-500/20 items-center justify-center"
              >
                <Pencil size={16} color="#00d4aa" />
              </Pressable>
            )}
            <Pressable
              onPress={shareSchedule}
              className="w-9 h-9 rounded-full bg-blue-500/20 items-center justify-center"
            >
              <Share2 size={16} color="#3b82f6" />
            </Pressable>
            <Pressable
              onPress={copySchedule}
              className="w-9 h-9 rounded-full bg-[#1a1a1a] items-center justify-center"
            >
              <Copy size={16} color="#888" />
            </Pressable>
            <Pressable
              onPress={() => {
                setShowCalendarPicker(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="w-9 h-9 rounded-full bg-[#1a1a1a] items-center justify-center"
            >
              <CalendarDays size={18} color="#888" />
            </Pressable>
          </View>
        </View>

        {/* Date Navigator */}
        <View className="px-4 pb-3">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={goToPrevShow}
              disabled={selectedShowIndex === 0}
              className="w-10 h-10 rounded-full bg-[#1a1a1a] items-center justify-center"
            >
              <ChevronLeft size={20} color={selectedShowIndex === 0 ? "#333" : "#fff"} />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({
                  pathname: '/show-detail',
                  params: { showId: selectedShow.id, tourId: activeTour.id },
                });
              }}
              className="flex-1 mx-4 items-center"
            >
              <Text className="text-gray-500 text-xs">{dateInfo.weekday}</Text>
              <Text className="text-white text-lg font-bold">
                {dateInfo.month} {dateInfo.day}
              </Text>
            </Pressable>

            <Pressable
              onPress={goToNextShow}
              disabled={selectedShowIndex === upcomingShows.length - 1}
              className="w-10 h-10 rounded-full bg-[#1a1a1a] items-center justify-center"
            >
              <ChevronRight size={20} color={selectedShowIndex === upcomingShows.length - 1 ? "#333" : "#fff"} />
            </Pressable>
          </View>
        </View>

        {/* Venue Card - Clickable */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({
              pathname: '/show-detail',
              params: { showId: selectedShow.id, tourId: activeTour.id },
            });
          }}
          className="mx-4 mb-3 bg-[#141414] rounded-lg p-3"
        >
          <Text className="text-white text-sm font-semibold">{selectedShow.venue}</Text>
          <View className="flex-row items-center mt-1">
            <MapPin size={12} color="#666" />
            <Text className="text-gray-500 text-xs ml-1">{selectedShow.city}, {selectedShow.state}</Text>
            {selectedShow.capacity > 0 && (
              <>
                <Text className="text-gray-600 mx-1.5">·</Text>
                <Users size={12} color="#666" />
                <Text className="text-gray-500 text-xs ml-1">{selectedShow.capacity.toLocaleString()}</Text>
              </>
            )}
          </View>
        </Pressable>

        {/* Show dots */}
        <View className="flex-row justify-center pb-3 gap-1">
          {upcomingShows.slice(0, 12).map((show, index) => (
            <Pressable
              key={show.id}
              onPress={() => {
                setSelectedShowIndex(index);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                "h-1.5 rounded-full",
                index === selectedShowIndex ? "w-4 bg-[#22c55e]" : "w-1.5 bg-[#2a2a2a]"
              )}
            />
          ))}
        </View>

        {/* Timeline */}
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="pb-24">
            {timelineEvents.map((event, index) => {
              const Icon = event.icon;
              const isShow = event.type === 'show';
              const isTravel = event.type === 'travel';

              return (
                <Animated.View
                  key={event.id}
                  entering={FadeInRight.delay(index * 40).duration(250)}
                >
                  {isTravel ? (
                    // Travel Row
                    <View className="flex-row items-center py-3 mb-2 bg-[#0f0f0f] rounded-lg px-3 border border-[#1a1a1a]">
                      <Navigation size={16} color="#6b7280" />
                      <View className="flex-1 ml-3">
                        <Text className="text-gray-400 text-sm">{event.label}</Text>
                        <Text className="text-gray-600 text-xs mt-0.5">{event.notes}</Text>
                      </View>
                    </View>
                  ) : (
                    // Regular Timeline Row
                    <View className="flex-row mb-1">
                      {/* Time */}
                      <View className="w-14 items-end pr-3 pt-3">
                        <Text className={cn(
                          "text-sm font-bold",
                          isShow ? "text-[#22c55e]" : "text-white"
                        )}>
                          {event.time}
                        </Text>
                      </View>

                      {/* Timeline */}
                      <View className="items-center pt-1">
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: `${event.color}20` }}
                        >
                          <Icon size={14} color={event.color} />
                        </View>
                        {index < timelineEvents.length - 1 && !isTravel && (
                          <View
                            className="w-0.5 flex-1 min-h-[32px]"
                            style={{ backgroundColor: `${event.color}30` }}
                          />
                        )}
                      </View>

                      {/* Event Details */}
                      <View className="flex-1 pl-3 pb-4 pt-2 flex-row items-start justify-between">
                        <View>
                          <Text className={cn(
                            "font-semibold",
                            isShow ? "text-[#22c55e]" : "text-white"
                          )}>
                            {event.label}
                          </Text>
                          {event.notes && (
                            <Text className="text-gray-600 text-xs mt-0.5">{event.notes}</Text>
                          )}
                        </View>
                        {event.editable && canEdit() && (
                          <Pressable
                            onPress={() => {
                              setShowEditModal(true);
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            className="p-1"
                          >
                            <Pencil size={12} color="#6b7280" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit Schedule Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <EditScheduleModal
          show={selectedShow}
          tourId={activeTour?.id}
          onClose={() => setShowEditModal(false)}
          onSave={(updates) => {
            if (activeTour) {
              updateShow(activeTour.id, selectedShow.id, updates);
              setShowEditModal(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }}
        />
      </Modal>

      {/* Calendar Picker Modal */}
      <Modal
        visible={showCalendarPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendarPicker(false)}
      >
        <ShowPickerModal
          shows={upcomingShows}
          selectedIndex={selectedShowIndex}
          onSelect={(index) => {
            setSelectedShowIndex(index);
            setShowCalendarPicker(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onClose={() => setShowCalendarPicker(false)}
        />
      </Modal>
    </View>
  );
}

function EditScheduleModal({
  show,
  tourId,
  onClose,
  onSave,
}: {
  show: Show;
  tourId?: string;
  onClose: () => void;
  onSave: (updates: Partial<Show>) => void;
}) {
  const [loadIn, setLoadIn] = useState(show.loadIn);
  const [soundcheck, setSoundcheck] = useState(show.soundcheck);
  const [doors, setDoors] = useState(show.doors);
  const [showTime, setShowTime] = useState(show.showTime);
  const [curfew, setCurfew] = useState(show.curfew);
  const [notes, setNotes] = useState(show.notes || '');

  const handleSave = () => {
    onSave({
      loadIn,
      soundcheck,
      doors,
      showTime,
      curfew,
      notes: notes.trim(),
    });
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Edit Schedule</Text>
          <Pressable onPress={handleSave}>
            <Save size={22} color="#00d4aa" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className="bg-[#1a1a2e] rounded-xl p-4 mb-6">
            <Text className="text-white font-semibold">{show.venue}</Text>
            <Text className="text-gray-500 text-sm">{show.city}, {show.state}</Text>
            <Text className="text-emerald-400 text-xs mt-1">
              {new Date(show.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>

          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Schedule Times</Text>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Truck size={16} color="#6b7280" />
                <Text className="text-gray-400 text-sm ml-2">Load In</Text>
              </View>
              <TextInput
                value={loadIn}
                onChangeText={setLoadIn}
                placeholder="10:00"
                placeholderTextColor="#4b5563"
                className="text-white text-lg font-bold"
              />
            </View>
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Mic size={16} color="#3b82f6" />
                <Text className="text-gray-400 text-sm ml-2">Soundcheck</Text>
              </View>
              <TextInput
                value={soundcheck}
                onChangeText={setSoundcheck}
                placeholder="16:00"
                placeholderTextColor="#4b5563"
                className="text-white text-lg font-bold"
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <DoorOpen size={16} color="#8b5cf6" />
                <Text className="text-gray-400 text-sm ml-2">Doors</Text>
              </View>
              <TextInput
                value={doors}
                onChangeText={setDoors}
                placeholder="19:00"
                placeholderTextColor="#4b5563"
                className="text-white text-lg font-bold"
              />
            </View>
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Music size={16} color="#22c55e" />
                <Text className="text-gray-400 text-sm ml-2">Show</Text>
              </View>
              <TextInput
                value={showTime}
                onChangeText={setShowTime}
                placeholder="20:00"
                placeholderTextColor="#4b5563"
                className="text-emerald-400 text-lg font-bold"
              />
            </View>
          </View>

          <View className="bg-[#1a1a2e] rounded-xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <LogOut size={16} color="#ef4444" />
              <Text className="text-gray-400 text-sm ml-2">Curfew</Text>
            </View>
            <TextInput
              value={curfew}
              onChangeText={setCurfew}
              placeholder="23:00"
              placeholderTextColor="#4b5563"
              className="text-white text-lg font-bold"
            />
          </View>

          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes about this show..."
            placeholderTextColor="#4b5563"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[100px]"
          />

          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ShowPickerModal({
  shows,
  selectedIndex,
  onSelect,
  onClose,
}: {
  shows: Show[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Select Show</Text>
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 px-5 pt-4">
          {shows.map((show, index) => {
            const isSelected = index === selectedIndex;
            const date = new Date(show.date);

            return (
              <Pressable
                key={show.id}
                onPress={() => onSelect(index)}
                className={cn(
                  "flex-row items-center p-4 rounded-xl mb-2",
                  isSelected ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-[#1a1a2e]"
                )}
              >
                <View className={cn(
                  "w-12 h-12 rounded-full items-center justify-center mr-4",
                  isSelected ? "bg-emerald-500" : "bg-[#2a2a2a]"
                )}>
                  <Text className="text-white font-bold text-lg">{date.getDate()}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">{show.venue}</Text>
                  <Text className="text-gray-500 text-sm">{show.city}, {show.state}</Text>
                  <Text className="text-gray-600 text-xs mt-0.5">
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                {isSelected && (
                  <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  let newHours = h + Math.floor(hours);
  const newMinutes = m + Math.round((hours % 1) * 60);
  if (newMinutes >= 60) newHours += 1;
  if (newHours >= 24) newHours -= 24;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes % 60).padStart(2, '0')}`;
}
