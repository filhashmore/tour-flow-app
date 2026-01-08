import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Phone,
  Mail,
  CalendarDays,
  Plus,
  X,
  Clock,
  Users,
  FileText,
  Music,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTourFlowStore, type Show, type Tour } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';

type ViewMode = 'upcoming' | 'past' | 'all';

export default function CalendarScreen() {
  const router = useRouter();
  const tours = useTourFlowStore(s => s.tours);
  const tasks = useTourFlowStore(s => s.tasks);
  const addShow = useTourFlowStore(s => s.addShow);
  const canEdit = useTourFlowStore(s => s.canEdit);
  const { isAdminOfTour, isAuthenticated } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedShowId, setExpandedShowId] = useState<string | null>(null);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const activeTour = tours.find(t => t.status === 'upcoming' || t.status === 'active');
  const allTours = tours.filter(t => t.status === 'upcoming' || t.status === 'active' || t.status === 'completed');

  // Get tours user is admin of (for adding shows)
  // In offline mode or for locally created tours, user is admin of all their tours
  const adminTours = useMemo(() => {
    // If local role is admin, user can add shows to any tour
    if (canEdit()) {
      return allTours;
    }
    // Otherwise check Supabase memberships
    if (isAuthenticated) {
      return allTours.filter(t => isAdminOfTour(t.id));
    }
    // Offline mode - user is admin of all their tours
    return allTours;
  }, [allTours, isAuthenticated, isAdminOfTour, canEdit]);

  const allShows = useMemo(() => {
    // Get shows from ALL tours, not just the active tour
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const showsWithTours: (Show & { tour: Tour })[] = [];

    allTours.forEach(tour => {
      tour.shows.forEach(show => {
        showsWithTours.push({ ...show, tour });
      });
    });

    return showsWithTours
      .filter(show => {
        const showDate = new Date(show.date);
        showDate.setHours(0, 0, 0, 0);
        if (viewMode === 'upcoming') return showDate >= now;
        if (viewMode === 'past') return showDate < now;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return viewMode === 'past' ? dateB - dateA : dateA - dateB;
      });
  }, [allTours, viewMode]);

  // All shows from all tours (unfiltered) for calendar view modal
  const calendarShows = useMemo(() => {
    const shows: (Show & { tourId: string })[] = [];
    allTours.forEach(tour => {
      tour.shows.forEach(show => {
        shows.push({ ...show, tourId: tour.id });
      });
    });
    return shows;
  }, [allTours]);

  const getShowStatus = (show: Show) => {
    const showTasks = tasks.filter(t => t.showId === show.id);
    const urgentTasks = showTasks.filter(t => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high'));

    if (show.status === 'cancelled') return { label: 'CANCELLED', color: '#dc2626' };
    if (urgentTasks.length > 0) return { label: 'ACTION', color: '#eab308' };
    if (show.status === 'pending') return { label: 'PENDING', color: '#6b7280' };
    if (show.status === 'confirmed') return { label: 'CONFIRMED', color: '#22c55e' };
    return { label: 'TBD', color: '#6b7280' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShowPress = (showId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedShowId(expandedShowId === showId ? null : showId);
  };

  const navigateToShowDetail = (show: Show & { tour: Tour }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/show-detail',
      params: { showId: show.id, tourId: show.tour.id },
    });
  };

  const generateDaySheet = (show: Show & { tour: Tour }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/assistant');
  };

  const handlePhoneCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-4 pt-2 pb-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-xl font-bold">Dates</Text>
            <View className="flex-row items-center gap-2">
              {canEdit() && adminTours.length > 0 && (
                <Pressable
                  onPress={() => {
                    setShowAddModal(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="w-9 h-9 rounded-full bg-emerald-500 items-center justify-center"
                >
                  <Plus size={18} color="#fff" strokeWidth={2.5} />
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  setShowCalendarView(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="w-9 h-9 rounded-full bg-[#1a1a1a] items-center justify-center"
              >
                <CalendarDays size={18} color="#888" />
              </Pressable>
            </View>
          </View>

          {/* Segmented Control */}
          <View className="flex-row mt-3 bg-[#1a1a1a] rounded-lg p-0.5">
            {(['upcoming', 'past', 'all'] as ViewMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => {
                  setViewMode(mode);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className={cn(
                  "flex-1 py-2 rounded-md",
                  viewMode === mode && "bg-[#2a2a2a]"
                )}
              >
                <Text className={cn(
                  "text-center text-xs font-semibold uppercase tracking-wide",
                  viewMode === mode ? "text-white" : "text-gray-500"
                )}>
                  {mode}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tour Info Bar */}
        {activeTour && (
          <View className="px-4 py-2 flex-row items-center justify-between border-b border-[#1a1a1a]">
            <Text className="text-gray-500 text-xs">{activeTour.artist}</Text>
            <Text className="text-gray-600 text-xs">{allShows.length} shows</Text>
          </View>
        )}

        {/* Shows List */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
          }
        >
          {!activeTour || allShows.length === 0 ? (
            <View className="items-center justify-center py-20">
              <CalendarDays size={40} color="#333" />
              <Text className="text-gray-600 mt-3 text-sm">
                {!activeTour ? 'No active tour' : `No ${viewMode} shows`}
              </Text>
            </View>
          ) : (
            <>
              {allShows.map((show, index) => {
                const dateInfo = formatDate(show.date);
                const status = getShowStatus(show);
                const isExpanded = expandedShowId === show.id;
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const showDate = new Date(show.date);
                showDate.setHours(0, 0, 0, 0);
                const daysAway = Math.ceil((showDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isToday = daysAway === 0;
                const isSoon = daysAway >= 1 && daysAway <= 3;
                const isPast = daysAway < 0;

                return (
                  <Animated.View
                    key={show.id}
                    entering={FadeInDown.delay(index * 20).duration(200)}
                  >
                    <Pressable
                      onPress={() => handleShowPress(show.id)}
                      onLongPress={() => navigateToShowDetail(show)}
                      className={cn(
                        "border-b border-[#1a1a1a]",
                        isToday && "bg-[#0f1a0f]",
                        isPast && "opacity-60"
                      )}
                    >
                      {/* Larger horizontal tile */}
                      <View className="flex-row px-4 py-4">
                        {/* Date Circle */}
                        <View className={cn(
                          "w-14 h-14 rounded-full items-center justify-center mr-4",
                          isToday ? "bg-[#22c55e]" : isSoon ? "bg-[#1a2a1a]" : isPast ? "bg-[#1a1a1a]" : "bg-[#1a1a1a]"
                        )}>
                          <Text className={cn(
                            "text-xl font-bold",
                            isToday ? "text-white" : isSoon ? "text-emerald-400" : isPast ? "text-gray-500" : "text-white"
                          )}>
                            {dateInfo.day}
                          </Text>
                          <Text className={cn(
                            "text-[9px] font-bold -mt-0.5",
                            isToday ? "text-emerald-100" : isSoon ? "text-emerald-500" : isPast ? "text-gray-600" : "text-gray-500"
                          )}>
                            {dateInfo.month}
                          </Text>
                        </View>

                        {/* Show Info */}
                        <View className="flex-1 justify-center">
                          <Text className="text-white text-base font-semibold" numberOfLines={1}>
                            {show.venue}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <MapPin size={12} color="#666" />
                            <Text className="text-gray-500 text-sm ml-1">
                              {show.city}, {show.state}
                            </Text>
                          </View>
                          <View className="flex-row items-center mt-1">
                            <Clock size={12} color="#666" />
                            <Text className="text-gray-400 text-xs ml-1">Show: {show.showTime}</Text>
                            {show.capacity > 0 && (
                              <>
                                <Text className="text-gray-600 mx-1.5">·</Text>
                                <Users size={12} color="#666" />
                                <Text className="text-gray-400 text-xs ml-1">{show.capacity.toLocaleString()}</Text>
                              </>
                            )}
                          </View>
                        </View>

                        {/* Status & Arrow */}
                        <View className="items-end justify-center">
                          <Text
                            className="text-[10px] font-bold tracking-wider"
                            style={{ color: status.color }}
                          >
                            {status.label}
                          </Text>
                          <Text className="text-gray-600 text-xs mt-1">{dateInfo.weekday}</Text>
                          <ChevronRight size={16} color="#333" className="mt-1" />
                        </View>
                      </View>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <Animated.View
                          entering={FadeIn.duration(150)}
                          className="px-4 pb-4 bg-[#0a0a0a]"
                        >
                          {/* Timeline */}
                          <View className="flex-row py-3 border-t border-[#1a1a1a]">
                            <View className="flex-1">
                              <Text className="text-gray-600 text-[10px]">LOAD</Text>
                              <Text className="text-white text-sm font-medium">{show.loadIn}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-gray-600 text-[10px]">SC</Text>
                              <Text className="text-white text-sm font-medium">{show.soundcheck}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-gray-600 text-[10px]">DOORS</Text>
                              <Text className="text-white text-sm font-medium">{show.doors}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-gray-600 text-[10px]">SHOW</Text>
                              <Text className="text-emerald-400 text-sm font-bold">{show.showTime}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-gray-600 text-[10px]">CURFEW</Text>
                              <Text className="text-white text-sm font-medium">{show.curfew}</Text>
                            </View>
                          </View>

                          {/* Notes */}
                          {show.notes && (
                            <View className="py-2 border-t border-[#1a1a1a]">
                              <Text className="text-gray-400 text-sm">{show.notes}</Text>
                            </View>
                          )}

                          {/* Contact */}
                          {show.venueContact && (
                            <View className="flex-row items-center py-3 border-t border-[#1a1a1a]">
                              <Text className="text-gray-500 text-sm flex-1">{show.venueContact}</Text>
                              {show.venuePhone && (
                                <Pressable
                                  onPress={() => handlePhoneCall(show.venuePhone)}
                                  className="p-2 bg-emerald-500/20 rounded-full mr-2"
                                >
                                  <Phone size={16} color="#22c55e" />
                                </Pressable>
                              )}
                              {show.venueEmail && (
                                <Pressable
                                  onPress={() => handleEmail(show.venueEmail)}
                                  className="p-2 bg-blue-500/20 rounded-full"
                                >
                                  <Mail size={16} color="#3b82f6" />
                                </Pressable>
                              )}
                            </View>
                          )}

                          {/* Actions */}
                          <View className="flex-row gap-3 pt-2">
                            <Pressable
                              onPress={() => navigateToShowDetail(show)}
                              className="flex-1 bg-[#22c55e] py-3 rounded-lg items-center"
                            >
                              <Text className="text-white text-sm font-semibold">View Details</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => generateDaySheet(show)}
                              className="flex-1 bg-[#1a1a1a] py-3 rounded-lg items-center border border-[#2a2a2a] flex-row justify-center"
                            >
                              <FileText size={14} color="#00d4aa" />
                              <Text className="text-emerald-400 text-sm font-medium ml-2">Day Sheet</Text>
                            </Pressable>
                          </View>
                        </Animated.View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
              <View className="h-24" />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Monthly Calendar Modal */}
      <Modal
        visible={showCalendarView}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendarView(false)}
      >
        <CalendarViewModal
          shows={calendarShows}
          currentMonth={calendarMonth}
          onChangeMonth={setCalendarMonth}
          onSelectDate={(date) => {
            const show = calendarShows.find(s => s.date === date);
            if (show) {
              setShowCalendarView(false);
              router.push({
                pathname: '/show-detail',
                params: { showId: show.id, tourId: show.tourId },
              });
            }
          }}
          onClose={() => setShowCalendarView(false)}
        />
      </Modal>

      {/* Add Date Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddDateModal
          tours={adminTours}
          defaultTourId={activeTour?.id || adminTours[0]?.id}
          onClose={() => setShowAddModal(false)}
          onAdd={(tourId, show) => {
            addShow(tourId, show);
            setShowAddModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      </Modal>
    </View>
  );
}

function CalendarViewModal({
  shows,
  currentMonth,
  onChangeMonth,
  onSelectDate,
  onClose,
}: {
  shows: Show[];
  currentMonth: Date;
  onChangeMonth: (date: Date) => void;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}) {
  const showDates = new Set(shows.map(s => s.date));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onChangeMonth(newDate);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const nextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onChangeMonth(newDate);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isShowDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return showDates.has(`${year}-${month}-${dayStr}`);
  };

  const handleDayPress = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    if (showDates.has(dateStr)) {
      onSelectDate(dateStr);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Calendar</Text>
          <View className="w-6" />
        </View>

        <View className="px-5 pt-6">
          {/* Month Navigation */}
          <View className="flex-row items-center justify-between mb-6">
            <Pressable onPress={prevMonth} className="w-10 h-10 rounded-full bg-[#1a1a2e] items-center justify-center">
              <ChevronLeft size={20} color="#fff" />
            </Pressable>
            <Text className="text-white text-xl font-bold">{monthName}</Text>
            <Pressable onPress={nextMonth} className="w-10 h-10 rounded-full bg-[#1a1a2e] items-center justify-center">
              <ChevronRight size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Day Headers */}
          <View className="flex-row mb-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <View key={day} className="flex-1 items-center">
                <Text className="text-gray-500 text-xs font-semibold">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap">
            {days.map((day, index) => {
              const hasShow = day !== null && isShowDate(day);
              const isToday = day !== null &&
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth.getMonth() &&
                new Date().getFullYear() === currentMonth.getFullYear();

              return (
                <Pressable
                  key={index}
                  onPress={() => day !== null && handleDayPress(day)}
                  className="w-[14.28%] aspect-square items-center justify-center"
                >
                  {day !== null && (
                    <View className={cn(
                      "w-10 h-10 rounded-full items-center justify-center",
                      hasShow && "bg-emerald-500",
                      isToday && !hasShow && "border-2 border-emerald-500"
                    )}>
                      <Text className={cn(
                        "text-base font-medium",
                        hasShow ? "text-white" : isToday ? "text-emerald-400" : "text-gray-400"
                      )}>
                        {day}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Legend */}
          <View className="flex-row justify-center mt-6 gap-6">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-gray-400 text-sm">Show Date</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full border-2 border-emerald-500 mr-2" />
              <Text className="text-gray-400 text-sm">Today</Text>
            </View>
          </View>

          {/* Shows this month */}
          <View className="mt-8">
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Shows This Month</Text>
            {shows
              .filter(s => {
                const showDate = new Date(s.date);
                return showDate.getMonth() === currentMonth.getMonth() &&
                       showDate.getFullYear() === currentMonth.getFullYear();
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(show => (
                <Pressable
                  key={show.id}
                  onPress={() => onSelectDate(show.date)}
                  className="bg-[#1a1a2e] rounded-xl p-3 mb-2 flex-row items-center"
                >
                  <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
                    <Text className="text-emerald-400 font-bold">{new Date(show.date).getDate()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">{show.venue}</Text>
                    <Text className="text-gray-500 text-xs">{show.city}, {show.state}</Text>
                  </View>
                  <ChevronRight size={16} color="#6b7280" />
                </Pressable>
              ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function AddDateModal({
  tours,
  defaultTourId,
  onClose,
  onAdd,
}: {
  tours: Tour[];
  defaultTourId?: string;
  onClose: () => void;
  onAdd: (tourId: string, show: Show) => void;
}) {
  const [selectedTourId, setSelectedTourId] = useState(defaultTourId || tours[0]?.id || '');
  const [showTourSelector, setShowTourSelector] = useState(false);
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [date, setDate] = useState('');
  const [loadIn, setLoadIn] = useState('10:00');
  const [soundcheck, setSoundcheck] = useState('16:00');
  const [doors, setDoors] = useState('19:00');
  const [showTime, setShowTime] = useState('20:00');
  const [curfew, setCurfew] = useState('23:00');
  const [capacity, setCapacity] = useState('');
  const [venueContact, setVenueContact] = useState('');
  const [venuePhone, setVenuePhone] = useState('');
  const [venueEmail, setVenueEmail] = useState('');
  const [notes, setNotes] = useState('');

  const selectedTour = tours.find(t => t.id === selectedTourId);

  const handleAdd = () => {
    if (!venue.trim() || !city.trim() || !date.trim() || !selectedTourId) return;

    const show: Show = {
      id: `show-${Date.now()}`,
      tourId: selectedTourId,
      venue: venue.trim(),
      city: city.trim(),
      state: state.trim(),
      country: 'USA',
      date,
      loadIn,
      soundcheck,
      doors,
      showTime,
      curfew,
      status: 'pending',
      venueContact: venueContact.trim(),
      venuePhone: venuePhone.trim(),
      venueEmail: venueEmail.trim(),
      capacity: parseInt(capacity) || 0,
      notes: notes.trim(),
    };

    onAdd(selectedTourId, show);
  };

  const isValid = venue.trim() && city.trim() && date.trim() && selectedTourId;

  if (tours.length === 0) {
    return (
      <View className="flex-1 bg-[#0a0a0f]">
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
            <Pressable onPress={onClose}>
              <X size={24} color="#6b7280" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Add Date</Text>
            <View className="w-10" />
          </View>
          <View className="flex-1 items-center justify-center px-8">
            <Music size={48} color="#4b5563" />
            <Text className="text-white text-lg font-semibold mt-4 text-center">No Tours Available</Text>
            <Text className="text-gray-400 text-center mt-2">Create a tour first to add shows to it.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Add Date</Text>
          <Pressable onPress={handleAdd} disabled={!isValid}>
            <Text className={cn(
              "text-base font-semibold",
              isValid ? "text-emerald-400" : "text-gray-600"
            )}>Add</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Tour Selector */}
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Add to Tour *</Text>
            <Pressable
              onPress={() => setShowTourSelector(!showTourSelector)}
              className="bg-[#1a1a2e] px-4 py-3 rounded-xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <Music size={16} color="#00d4aa" />
                <Text className="text-white ml-3 flex-1" numberOfLines={1}>
                  {selectedTour?.name || 'Select a tour'}
                </Text>
              </View>
              <ChevronDown size={18} color="#6b7280" style={{ transform: [{ rotate: showTourSelector ? '180deg' : '0deg' }] }} />
            </Pressable>

            {showTourSelector && (
              <View className="bg-[#1a1a2e] mt-2 rounded-xl overflow-hidden border border-white/10">
                {tours.map((tour, index) => (
                  <Pressable
                    key={tour.id}
                    onPress={() => {
                      setSelectedTourId(tour.id);
                      setShowTourSelector(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={cn(
                      "px-4 py-3 flex-row items-center justify-between",
                      index < tours.length - 1 && "border-b border-white/5"
                    )}
                  >
                    <View className="flex-1">
                      <Text className="text-white font-medium">{tour.name}</Text>
                      <Text className="text-gray-500 text-sm">{tour.artist}</Text>
                    </View>
                    {selectedTourId === tour.id && (
                      <Check size={18} color="#00d4aa" />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Venue Name *</Text>
            <TextInput
              value={venue}
              onChangeText={setVenue}
              placeholder="e.g., The Anthem"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <View className="flex-row gap-3 mb-5">
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">City *</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            <View className="w-24">
              <Text className="text-gray-400 text-sm mb-2">State</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="ST"
                placeholderTextColor="#4b5563"
                autoCapitalize="characters"
                maxLength={2}
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Date (YYYY-MM-DD) *</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="2026-01-15"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Schedule</Text>
          <View className="flex-row flex-wrap gap-3 mb-5">
            <View className="flex-1 min-w-[30%]">
              <Text className="text-gray-400 text-xs mb-1">Load In</Text>
              <TextInput
                value={loadIn}
                onChangeText={setLoadIn}
                placeholder="10:00"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
              />
            </View>
            <View className="flex-1 min-w-[30%]">
              <Text className="text-gray-400 text-xs mb-1">Soundcheck</Text>
              <TextInput
                value={soundcheck}
                onChangeText={setSoundcheck}
                placeholder="16:00"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
              />
            </View>
            <View className="flex-1 min-w-[30%]">
              <Text className="text-gray-400 text-xs mb-1">Doors</Text>
              <TextInput
                value={doors}
                onChangeText={setDoors}
                placeholder="19:00"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
              />
            </View>
            <View className="flex-1 min-w-[30%]">
              <Text className="text-gray-400 text-xs mb-1">Show Time</Text>
              <TextInput
                value={showTime}
                onChangeText={setShowTime}
                placeholder="20:00"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
              />
            </View>
            <View className="flex-1 min-w-[30%]">
              <Text className="text-gray-400 text-xs mb-1">Curfew</Text>
              <TextInput
                value={curfew}
                onChangeText={setCurfew}
                placeholder="23:00"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
              />
            </View>
            <View className="flex-1 min-w-[30%]">
              <Text className="text-gray-400 text-xs mb-1">Capacity</Text>
              <TextInput
                value={capacity}
                onChangeText={setCapacity}
                placeholder="2500"
                placeholderTextColor="#4b5563"
                keyboardType="numeric"
                className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
              />
            </View>
          </View>

          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Venue Contact</Text>
          <View className="mb-5">
            <TextInput
              value={venueContact}
              onChangeText={setVenueContact}
              placeholder="Contact Name"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base mb-3"
            />
            <View className="flex-row gap-3">
              <TextInput
                value={venuePhone}
                onChangeText={setVenuePhone}
                placeholder="Phone"
                placeholderTextColor="#4b5563"
                keyboardType="phone-pad"
                className="flex-1 bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
              <TextInput
                value={venueEmail}
                onChangeText={setVenueEmail}
                placeholder="Email"
                placeholderTextColor="#4b5563"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="PA system, special requirements..."
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[80px]"
            />
          </View>

          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
