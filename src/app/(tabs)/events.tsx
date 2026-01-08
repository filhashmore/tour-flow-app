import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, SectionList, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin,
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  Music,
  Plus,
  X,
  Filter,
  Check,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTourFlowStore, type Show, type Tour } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';

type ShowWithTour = Show & { tour: Tour };

type MonthSection = {
  title: string;
  data: ShowWithTour[];
};

export default function EventsScreen() {
  const router = useRouter();
  const tours = useTourFlowStore(s => s.tours);
  const addShow = useTourFlowStore(s => s.addShow);
  const canEdit = useTourFlowStore(s => s.canEdit);
  const settings = useTourFlowStore(s => s.settings);
  const canViewFinancials = useTourFlowStore(s => s.canViewFinancials);
  const { isAdminOfTour, isAuthenticated } = useAuth();

  const [selectedTourId, setSelectedTourId] = useState<string | 'all'>('all');
  const [showTourPicker, setShowTourPicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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

  // Group shows by month (either from all tours or selected tour)
  const sections: MonthSection[] = useMemo(() => {
    const grouped: Record<string, ShowWithTour[]> = {};

    const toursToShow = selectedTourId === 'all'
      ? allTours
      : allTours.filter(t => t.id === selectedTourId);

    toursToShow.forEach(tour => {
      tour.shows
        .map(show => ({ ...show, tour }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(show => {
          const date = new Date(show.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (!grouped[monthKey]) {
            grouped[monthKey] = [];
          }
          grouped[monthKey].push(show);
        });
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, shows]) => ({
        title: new Date(shows[0].date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        data: shows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      }));
  }, [allTours, selectedTourId]);

  const totalShows = sections.reduce((acc, s) => acc + s.data.length, 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

  const getShowStatus = (show: Show) => {
    if (show.status === 'cancelled') return { label: 'CANCELLED', color: '#ef4444' };
    if (show.status === 'pending') return { label: 'PENDING', color: '#6b7280' };
    if (show.status === 'confirmed') return { label: 'CONFIRMED', color: '#22c55e' };
    return { label: 'TBD', color: '#6b7280' };
  };

  const navigateToShow = (show: ShowWithTour) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/show-detail',
      params: { showId: show.id, tourId: show.tour.id },
    });
  };

  const renderSectionHeader = ({ section }: { section: MonthSection }) => (
    <View className="bg-[#0d0d0d] px-4 py-3 border-b border-[#1a1a1a]">
      <Text className="text-emerald-400 text-sm font-bold uppercase tracking-wider">
        {section.title}
      </Text>
      <Text className="text-gray-600 text-xs mt-0.5">
        {section.data.length} {section.data.length === 1 ? 'show' : 'shows'}
      </Text>
    </View>
  );

  const renderItem = ({ item: show }: { item: ShowWithTour }) => {
    const dateInfo = formatDate(show.date);
    const status = getShowStatus(show);
    const isPast = new Date(show.date) < new Date();

    return (
      <Pressable
        onPress={() => navigateToShow(show)}
        className={cn(
          "flex-row border-b border-[#1a1a1a]",
          isPast && "opacity-50"
        )}
      >
        {/* Date Badge */}
        <View className="w-20 py-4 items-center justify-center border-r border-[#1a1a1a]">
          <Text className="text-gray-500 text-[10px] font-bold tracking-wider">
            {dateInfo.weekday}
          </Text>
          <Text className="text-white text-2xl font-bold">{dateInfo.day}</Text>
        </View>

        {/* Event Details */}
        <View className="flex-1 py-4 px-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-base font-bold flex-1 mr-2" numberOfLines={1}>
              {show.venue}
            </Text>
            <ChevronRight size={18} color="#333" />
          </View>

          <View className="flex-row items-center mt-1">
            <MapPin size={12} color="#666" />
            <Text className="text-gray-400 text-sm ml-1">
              {show.city}, {show.state}
            </Text>
          </View>

          <View className="flex-row items-center mt-2 gap-3">
            {/* Show Time */}
            <View className="flex-row items-center">
              <Music size={10} color="#22c55e" />
              <Text className="text-emerald-400 text-xs font-medium ml-1">{show.showTime}</Text>
            </View>

            {/* Capacity */}
            {show.capacity > 0 && (
              <View className="flex-row items-center">
                <Users size={10} color="#666" />
                <Text className="text-gray-500 text-xs ml-1">{show.capacity.toLocaleString()}</Text>
              </View>
            )}

            {/* Status */}
            <Text
              className="text-[10px] font-bold tracking-wider"
              style={{ color: status.color }}
            >
              {status.label}
            </Text>
          </View>

          {/* Tour Name (if multi-tour) */}
          {selectedTourId === 'all' && (
            <View className="mt-2 bg-[#1a1a2e] self-start px-2 py-1 rounded">
              <Text className="text-gray-500 text-xs">{show.tour.name}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const selectedTourName = selectedTourId === 'all'
    ? 'All Tours'
    : allTours.find(t => t.id === selectedTourId)?.name || 'Select Tour';

  if (!activeTour && allTours.length === 0) {
    return (
      <View className="flex-1 bg-[#0d0d0d]">
        <SafeAreaView edges={['top']} className="flex-1 items-center justify-center">
          <Calendar size={48} color="#333" />
          <Text className="text-gray-600 mt-4 font-medium">No tours available</Text>
          <Pressable
            onPress={() => router.push('/tours')}
            className="mt-6 bg-emerald-600 px-8 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Create Tour</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0d0d0d]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-2xl font-bold tracking-tight">Events</Text>
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
              <View className="bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#2a2a2a]">
                <Text className="text-gray-400 text-xs font-medium">{totalShows} shows</Text>
              </View>
            </View>
          </View>

          {/* Tour Selector */}
          <Pressable
            onPress={() => {
              setShowTourPicker(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="flex-row items-center mt-2 bg-[#1a1a1a] self-start px-3 py-2 rounded-lg"
          >
            <Filter size={14} color="#6b7280" />
            <Text className="text-gray-400 text-sm ml-2">{selectedTourName}</Text>
            <ChevronDown size={14} color="#6b7280" className="ml-1" />
          </Pressable>
        </View>

        {/* Events List by Month */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Calendar size={48} color="#333" />
              <Text className="text-gray-600 mt-4 font-medium">No events scheduled</Text>
            </View>
          }
        />
      </SafeAreaView>

      {/* Tour Picker Modal */}
      <Modal
        visible={showTourPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTourPicker(false)}
      >
        <TourPickerModal
          tours={allTours}
          selectedTourId={selectedTourId}
          onSelect={(id) => {
            setSelectedTourId(id);
            setShowTourPicker(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onClose={() => setShowTourPicker(false)}
        />
      </Modal>

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddEventModal
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

function TourPickerModal({
  tours,
  selectedTourId,
  onSelect,
  onClose,
}: {
  tours: Tour[];
  selectedTourId: string | 'all';
  onSelect: (id: string | 'all') => void;
  onClose: () => void;
}) {
  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Select Tour</Text>
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 px-5 pt-4">
          {/* All Tours Option */}
          <Pressable
            onPress={() => onSelect('all')}
            className={cn(
              "flex-row items-center p-4 rounded-xl mb-2",
              selectedTourId === 'all' ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-[#1a1a2e]"
            )}
          >
            <View className={cn(
              "w-10 h-10 rounded-full items-center justify-center mr-3",
              selectedTourId === 'all' ? "bg-emerald-500" : "bg-[#2a2a2a]"
            )}>
              <Filter size={18} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium">All Tours</Text>
              <Text className="text-gray-500 text-sm">View shows from all tours</Text>
            </View>
            {selectedTourId === 'all' && (
              <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center">
                <Text className="text-white text-xs font-bold">✓</Text>
              </View>
            )}
          </Pressable>

          {/* Individual Tours */}
          {tours.map(tour => {
            const isSelected = selectedTourId === tour.id;
            const statusColor = tour.status === 'active' || tour.status === 'upcoming' ? '#22c55e' :
                               tour.status === 'completed' ? '#6b7280' : '#f59e0b';

            return (
              <Pressable
                key={tour.id}
                onPress={() => onSelect(tour.id)}
                className={cn(
                  "flex-row items-center p-4 rounded-xl mb-2",
                  isSelected ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-[#1a1a2e]"
                )}
              >
                <View className={cn(
                  "w-10 h-10 rounded-full items-center justify-center mr-3",
                  isSelected ? "bg-emerald-500" : "bg-[#2a2a2a]"
                )}>
                  <Music size={18} color="#fff" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white font-medium">{tour.name}</Text>
                    <View className="w-2 h-2 rounded-full ml-2" style={{ backgroundColor: statusColor }} />
                  </View>
                  <Text className="text-gray-500 text-sm">{tour.artist}</Text>
                  <Text className="text-gray-600 text-xs mt-0.5">{tour.shows.length} shows</Text>
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

function AddEventModal({
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
      venueContact: '',
      venuePhone: '',
      venueEmail: '',
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
            <Text className="text-white text-lg font-semibold">Add Event</Text>
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
          <Text className="text-white text-lg font-semibold">Add Event</Text>
          <Pressable onPress={handleAdd} disabled={!isValid}>
            <Text className={cn(
              "text-base font-semibold",
              isValid ? "text-emerald-400" : "text-gray-600"
            )}>Add</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={10}
        >
          <ScrollView
            className="flex-1 px-5 pt-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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

            <View className="flex-row gap-3 mb-5">
              <View className="flex-1">
                <Text className="text-gray-400 text-sm mb-2">Date (YYYY-MM-DD) *</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="2026-01-15"
                  placeholderTextColor="#4b5563"
                  className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
                />
              </View>
              <View className="w-32">
                <Text className="text-gray-400 text-sm mb-2">Capacity</Text>
                <TextInput
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="2500"
                  placeholderTextColor="#4b5563"
                  keyboardType="numeric"
                  className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
                />
              </View>
            </View>

            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Schedule</Text>
            <View className="flex-row flex-wrap gap-3 mb-5">
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-400 text-xs mb-1">Load In</Text>
                <TextInput
                  value={loadIn}
                  onChangeText={setLoadIn}
                  placeholder="10:00"
                  placeholderTextColor="#4b5563"
                  className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-400 text-xs mb-1">Soundcheck</Text>
                <TextInput
                  value={soundcheck}
                  onChangeText={setSoundcheck}
                  placeholder="16:00"
                  placeholderTextColor="#4b5563"
                  className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-400 text-xs mb-1">Doors</Text>
                <TextInput
                  value={doors}
                  onChangeText={setDoors}
                  placeholder="19:00"
                  placeholderTextColor="#4b5563"
                  className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-400 text-xs mb-1">Show Time</Text>
                <TextInput
                  value={showTime}
                  onChangeText={setShowTime}
                  placeholder="20:00"
                  placeholderTextColor="#4b5563"
                  className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-gray-400 text-xs mb-1">Curfew</Text>
                <TextInput
                  value={curfew}
                  onChangeText={setCurfew}
                  placeholder="23:00"
                  placeholderTextColor="#4b5563"
                  className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg text-sm"
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
                textAlignVertical="top"
                scrollEnabled={true}
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[120px] max-h-[200px]"
              />
            </View>

            <View className="h-40" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
