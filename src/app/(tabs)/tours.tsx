import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  ChevronRight,
  X,
  Music,
  DollarSign,
  Users,
  Phone,
  Mail,
  Building,
  Check,
  EyeOff,
  Pencil,
  ChevronDown
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTourFlowStore, type Tour, type Show, type Crew } from '@/lib/store';
import { useAuth, useTourAccess } from '@/lib/auth-context';
import { cn } from '@/lib/cn';
import { linkTourToCrew, unlinkTourFromCrew } from '@/lib/supabase';

export default function ToursScreen() {
  const tours = useTourFlowStore(s => s.tours);
  const crews = useTourFlowStore(s => s.crews);
  const addTour = useTourFlowStore(s => s.addTour);
  const updateTour = useTourFlowStore(s => s.updateTour);
  const addShow = useTourFlowStore(s => s.addShow);
  const localCanViewFinancials = useTourFlowStore(s => s.canViewFinancials);
  const settings = useTourFlowStore(s => s.settings);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddShowModal, setShowAddShowModal] = useState(false);

  // Auth context for role-based access
  const { tourMemberships, crewMemberships, isAuthenticated, isAdminOfTour, isAdminOfCrew, canViewFinancials: authCanViewFinancials } = useAuth();

  // Determine if financials can be viewed for selected tour
  const canViewTourFinancials = (tourId: string): boolean => {
    // If not authenticated (offline mode), use local store permission
    if (!isAuthenticated) {
      return localCanViewFinancials();
    }

    // Check Supabase membership permission
    const membership = tourMemberships.find(m => m.tour_id === tourId);
    if (membership) {
      // Admins always see financials, crew only if explicitly allowed
      return membership.role === 'admin' || membership.can_view_financials;
    }

    // Fall back to local store
    return localCanViewFinancials();
  };

  // Check if user is admin of selected tour
  const isAdminOfSelectedTour = selectedTour ? isAdminOfTour(selectedTour.id) : false;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#00d4aa';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleSelectTour = (tour: Tour) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTour(tour);
  };

  const handleSelectShow = (show: Show) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedShow(show);
  };

  // Calculate tour totals
  const getTourFinancials = (tour: Tour) => {
    return tour.shows.reduce((acc, show) => {
      if (show.settlement) {
        acc.guarantee += show.settlement.guarantee;
        acc.bonus += show.settlement.bonus;
        acc.merch += show.settlement.merch;
        acc.expenses += show.settlement.expenses;
        acc.total += show.settlement.total;
      }
      return acc;
    }, { guarantee: 0, bonus: 0, merch: 0, expenses: 0, total: 0 });
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <LinearGradient
        colors={['#0f1419', '#0a0a0f']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-gray-500 text-sm font-medium tracking-wider uppercase">Tour Flow</Text>
            <Text className="text-white text-2xl font-bold mt-1">Tours</Text>
          </View>
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-full bg-emerald-500 items-center justify-center"
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>

        {!selectedTour ? (
          // Tour List View
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {tours.map((tour, index) => {
              const financials = getTourFinancials(tour);
              const confirmedShows = tour.shows.filter(s => s.status === 'confirmed').length;

              return (
                <Animated.View
                  key={tour.id}
                  entering={FadeInDown.delay(index * 100).duration(400)}
                >
                  <Pressable
                    onPress={() => handleSelectTour(tour)}
                    className="mb-4"
                  >
                    <LinearGradient
                      colors={['#1a1a2e', '#16213e']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, padding: 16 }}
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <View className={cn(
                              "w-2 h-2 rounded-full mr-2",
                              tour.status === 'active' && "bg-emerald-400",
                              tour.status === 'upcoming' && "bg-blue-400",
                              tour.status === 'completed' && "bg-gray-400"
                            )} />
                            <Text className="text-gray-400 text-xs uppercase tracking-wider">
                              {tour.status}
                            </Text>
                          </View>
                          <Text className="text-white text-lg font-bold">{tour.name}</Text>
                          <View className="flex-row items-center mt-1">
                            <Music size={12} color="#9ca3af" />
                            <Text className="text-gray-400 text-sm ml-1.5">{tour.artist}</Text>
                          </View>
                        </View>
                        <ChevronRight size={20} color="#6b7280" />
                      </View>

                      <View className="flex-row items-center gap-4 mb-3">
                        <View className="flex-row items-center">
                          <Calendar size={14} color="#6b7280" />
                          <Text className="text-gray-500 text-sm ml-1.5">
                            {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between pt-3 border-t border-white/10">
                        <View className="flex-row items-center gap-4">
                          <View className="flex-row items-center">
                            <MapPin size={14} color="#00d4aa" />
                            <Text className="text-gray-300 text-sm ml-1.5">
                              {confirmedShows}/{tour.shows.length} shows
                            </Text>
                          </View>
                        </View>
                        {financials.total > 0 && canViewTourFinancials(tour.id) ? (
                          <View className="flex-row items-center">
                            <DollarSign size={14} color="#00d4aa" />
                            <Text className="text-emerald-400 text-sm font-semibold">
                              {formatCurrency(financials.total)}
                            </Text>
                          </View>
                        ) : financials.total > 0 ? (
                          <View className="flex-row items-center">
                            <EyeOff size={14} color="#6b7280" />
                            <Text className="text-gray-500 text-sm ml-1">Hidden</Text>
                          </View>
                        ) : null}
                      </View>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              );
            })}

            <View className="h-24" />
          </ScrollView>
        ) : (
          // Tour Detail View
          <View className="flex-1">
            {/* Back Button */}
            <Pressable
              onPress={() => {
                setSelectedTour(null);
                setSelectedShow(null);
              }}
              className="px-5 mb-4 flex-row items-center"
            >
              <ChevronRight size={16} color="#00d4aa" style={{ transform: [{ rotate: '180deg' }] }} />
              <Text className="text-emerald-400 text-sm ml-1">Back to Tours</Text>
            </Pressable>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
              {/* Tour Header Card */}
              <Animated.View entering={FadeIn.duration(400)}>
                <LinearGradient
                  colors={['#00d4aa15', '#00d4aa05']}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: '#00d4aa30',
                  }}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-white text-xl font-bold mb-1">{selectedTour.name}</Text>
                      <Text className="text-gray-400 text-sm mb-3">{selectedTour.artist}</Text>
                    </View>
                    {isAdminOfSelectedTour && (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setShowEditModal(true);
                        }}
                        className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
                      >
                        <Pencil size={16} color="#00d4aa" />
                      </Pressable>
                    )}
                  </View>

                  <View className="flex-row flex-wrap gap-3">
                    <View className="bg-white/5 px-3 py-2 rounded-lg flex-row items-center">
                      <Calendar size={14} color="#00d4aa" />
                      <Text className="text-gray-300 text-sm ml-2">
                        {formatDate(selectedTour.startDate)} - {formatDate(selectedTour.endDate)}
                      </Text>
                    </View>
                    <View className="bg-white/5 px-3 py-2 rounded-lg flex-row items-center">
                      <MapPin size={14} color="#00d4aa" />
                      <Text className="text-gray-300 text-sm ml-2">{selectedTour.shows.length} shows</Text>
                    </View>
                  </View>

                  {selectedTour.notes && (
                    <Text className="text-gray-500 text-sm mt-3 pt-3 border-t border-white/10">
                      {selectedTour.notes}
                    </Text>
                  )}
                </LinearGradient>
              </Animated.View>

              {/* Tour Financials Summary - Only show if user has permission */}
              {getTourFinancials(selectedTour).total > 0 && canViewTourFinancials(selectedTour.id) && (
                <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mb-6">
                  <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Financials</Text>
                  <View className="bg-[#1a1a2e] rounded-xl p-4">
                    {(() => {
                      const fin = getTourFinancials(selectedTour);
                      return (
                        <>
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-400">Guarantees</Text>
                            <Text className="text-white font-medium">{formatCurrency(fin.guarantee)}</Text>
                          </View>
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-400">Bonuses</Text>
                            <Text className="text-white font-medium">{formatCurrency(fin.bonus)}</Text>
                          </View>
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-400">Merch</Text>
                            <Text className="text-white font-medium">{formatCurrency(fin.merch)}</Text>
                          </View>
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-400">Expenses</Text>
                            <Text className="text-red-400 font-medium">-{formatCurrency(fin.expenses)}</Text>
                          </View>
                          <View className="flex-row justify-between pt-2 border-t border-white/10">
                            <Text className="text-white font-semibold">Net Total</Text>
                            <Text className="text-emerald-400 font-bold text-lg">{formatCurrency(fin.total)}</Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                </Animated.View>
              )}

              {/* Hidden Financials Notice for crew without permission */}
              {getTourFinancials(selectedTour).total > 0 && !canViewTourFinancials(selectedTour.id) && (
                <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mb-6">
                  <View className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4 flex-row items-center">
                    <EyeOff size={18} color="#6b7280" />
                    <Text className="text-gray-400 ml-3 flex-1">
                      Financial information is hidden for your role
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Shows List */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Shows</Text>
                {isAdminOfSelectedTour && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowAddShowModal(true);
                    }}
                    className="flex-row items-center bg-emerald-500/20 px-3 py-1.5 rounded-lg"
                  >
                    <Plus size={14} color="#00d4aa" />
                    <Text className="text-emerald-400 text-xs font-medium ml-1">Add Show</Text>
                  </Pressable>
                )}
              </View>

              {selectedTour.shows.length === 0 && (
                <View className="bg-[#1a1a2e] rounded-xl p-6 items-center mb-4">
                  <MapPin size={32} color="#4b5563" />
                  <Text className="text-gray-400 mt-3 text-center">No shows yet</Text>
                  {isAdminOfSelectedTour && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setShowAddShowModal(true);
                      }}
                      className="mt-4 bg-emerald-500 px-4 py-2 rounded-lg flex-row items-center"
                    >
                      <Plus size={16} color="#fff" />
                      <Text className="text-white font-medium ml-1">Add First Show</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {selectedTour.shows.map((show, index) => (
                <Animated.View
                  key={show.id}
                  entering={FadeInDown.delay(150 + index * 50).duration(400)}
                >
                  <Pressable
                    onPress={() => setSelectedShow(selectedShow?.id === show.id ? null : show)}
                    className="mb-3"
                  >
                    <View className={cn(
                      "bg-[#1a1a2e] rounded-xl overflow-hidden",
                      selectedShow?.id === show.id && "border border-emerald-500/30"
                    )}>
                      <View className="p-4">
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                              <View
                                className="w-2 h-2 rounded-full mr-2"
                                style={{ backgroundColor: getStatusColor(show.status) }}
                              />
                              <Text className="text-gray-500 text-xs uppercase">{show.status}</Text>
                            </View>
                            <Text className="text-white font-bold">{show.venue}</Text>
                            <View className="flex-row items-center mt-0.5">
                              <MapPin size={12} color="#6b7280" />
                              <Text className="text-gray-400 text-sm ml-1">
                                {show.city}, {show.state}
                              </Text>
                            </View>
                          </View>
                          <View className="items-end">
                            <Text className="text-emerald-400 font-bold">{formatDate(show.date)}</Text>
                            {show.settlement && canViewTourFinancials(selectedTour?.id || '') && (
                              <Text className="text-gray-500 text-xs mt-1">
                                {formatCurrency(show.settlement.total)}
                              </Text>
                            )}
                          </View>
                        </View>

                        <View className="flex-row flex-wrap gap-2 mt-2">
                          <View className="bg-white/5 px-2 py-1 rounded">
                            <Text className="text-gray-400 text-xs">Load: {show.loadIn}</Text>
                          </View>
                          <View className="bg-white/5 px-2 py-1 rounded">
                            <Text className="text-gray-400 text-xs">SC: {show.soundcheck}</Text>
                          </View>
                          <View className="bg-white/5 px-2 py-1 rounded">
                            <Text className="text-gray-400 text-xs">Doors: {show.doors}</Text>
                          </View>
                          <View className="bg-white/5 px-2 py-1 rounded">
                            <Text className="text-gray-400 text-xs">Show: {show.showTime}</Text>
                          </View>
                          <View className="bg-white/5 px-2 py-1 rounded">
                            <Text className="text-gray-400 text-xs">Curfew: {show.curfew}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Expanded Show Details */}
                      {selectedShow?.id === show.id && (
                        <Animated.View
                          entering={FadeIn.duration(200)}
                          className="px-4 pb-4 pt-2 border-t border-white/10"
                        >
                          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                            Venue Contact
                          </Text>

                          <View className="space-y-2">
                            <View className="flex-row items-center">
                              <Users size={14} color="#6b7280" />
                              <Text className="text-gray-300 ml-2">{show.venueContact}</Text>
                            </View>
                            <View className="flex-row items-center mt-2">
                              <Phone size={14} color="#6b7280" />
                              <Text className="text-gray-300 ml-2">{show.venuePhone}</Text>
                            </View>
                            <View className="flex-row items-center mt-2">
                              <Mail size={14} color="#6b7280" />
                              <Text className="text-gray-300 ml-2">{show.venueEmail}</Text>
                            </View>
                            <View className="flex-row items-center mt-2">
                              <Building size={14} color="#6b7280" />
                              <Text className="text-gray-300 ml-2">Capacity: {show.capacity.toLocaleString()}</Text>
                            </View>
                          </View>

                          {show.notes && (
                            <View className="mt-3 pt-3 border-t border-white/10">
                              <Text className="text-gray-500 text-xs font-semibold uppercase mb-1">Notes</Text>
                              <Text className="text-gray-400 text-sm">{show.notes}</Text>
                            </View>
                          )}

                          {show.settlement && canViewTourFinancials(selectedTour?.id || '') && (
                            <View className="mt-3 pt-3 border-t border-white/10">
                              <Text className="text-gray-500 text-xs font-semibold uppercase mb-2">Settlement</Text>
                              <View className="bg-white/5 rounded-lg p-3">
                                <View className="flex-row justify-between mb-1">
                                  <Text className="text-gray-400 text-sm">Guarantee</Text>
                                  <Text className="text-white text-sm">{formatCurrency(show.settlement.guarantee)}</Text>
                                </View>
                                <View className="flex-row justify-between mb-1">
                                  <Text className="text-gray-400 text-sm">Bonus</Text>
                                  <Text className="text-white text-sm">{formatCurrency(show.settlement.bonus)}</Text>
                                </View>
                                <View className="flex-row justify-between mb-1">
                                  <Text className="text-gray-400 text-sm">Merch</Text>
                                  <Text className="text-white text-sm">{formatCurrency(show.settlement.merch)}</Text>
                                </View>
                                <View className="flex-row justify-between mb-1">
                                  <Text className="text-gray-400 text-sm">Expenses</Text>
                                  <Text className="text-red-400 text-sm">-{formatCurrency(show.settlement.expenses)}</Text>
                                </View>
                                <View className="flex-row justify-between mb-1">
                                  <Text className="text-gray-400 text-sm">Per Diem</Text>
                                  <Text className="text-white text-sm">{formatCurrency(show.settlement.perDiem)}</Text>
                                </View>
                                <View className="flex-row justify-between pt-2 border-t border-white/10">
                                  <Text className="text-white font-semibold text-sm">Net</Text>
                                  <Text className="text-emerald-400 font-bold">{formatCurrency(show.settlement.total)}</Text>
                                </View>
                              </View>
                            </View>
                          )}
                        </Animated.View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              <View className="h-24" />
            </ScrollView>
          </View>
        )}
      </SafeAreaView>

      {/* Add Tour Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddTourModal
          crews={crews}
          crewMemberships={crewMemberships}
          onClose={() => setShowAddModal(false)}
          onAdd={(tour) => {
            addTour(tour);
            setShowAddModal(false);
          }}
        />
      </Modal>

      {/* Edit Tour Modal */}
      {selectedTour && (
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditModal(false)}
        >
          <EditTourModal
            tour={selectedTour}
            crews={crews}
            crewMemberships={crewMemberships}
            onClose={() => setShowEditModal(false)}
            onSave={(updatedTour) => {
              updateTour(updatedTour.id, updatedTour);
              setSelectedTour(updatedTour);
              setShowEditModal(false);
            }}
          />
        </Modal>
      )}

      {/* Add Show Modal */}
      {selectedTour && (
        <Modal
          visible={showAddShowModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddShowModal(false)}
        >
          <AddShowModal
            tourId={selectedTour.id}
            onClose={() => setShowAddShowModal(false)}
            onAdd={(show) => {
              addShow(selectedTour.id, show);
              // Update selectedTour to reflect the new show
              const updatedTour = tours.find(t => t.id === selectedTour.id);
              if (updatedTour) {
                setSelectedTour({ ...updatedTour, shows: [...updatedTour.shows, show] });
              }
              setShowAddShowModal(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          />
        </Modal>
      )}
    </View>
  );
}

function AddTourModal({
  crews,
  crewMemberships,
  onClose,
  onAdd
}: {
  crews: Crew[];
  crewMemberships: Array<{ crew_id: string; role: 'admin' | 'member' }>;
  onClose: () => void;
  onAdd: (tour: Tour) => void;
}) {
  const [name, setName] = useState('');
  const [artist, setArtist] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState<string | undefined>(undefined);
  const [showCrewPicker, setShowCrewPicker] = useState(false);

  // Filter crews where user is admin
  const adminCrews = crews.filter(crew =>
    crewMemberships.some(m => m.crew_id === crew.id && m.role === 'admin')
  );

  const selectedCrew = adminCrews.find(c => c.id === selectedCrewId);

  const handleAdd = async () => {
    if (!name.trim() || !artist.trim()) return;

    const tour: Tour = {
      id: `tour-${Date.now()}`,
      name: name.trim(),
      artist: artist.trim(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      status: 'upcoming',
      shows: [],
      crew: [],
      notes: notes.trim(),
      crewId: selectedCrewId,
    };

    onAdd(tour);

    // If a crew was selected, link the tour to the crew in the database
    if (selectedCrewId) {
      try {
        await linkTourToCrew(tour.id, selectedCrewId);
        console.log('[Tours] Linked tour to crew:', selectedCrewId);
      } catch (error) {
        console.error('[Tours] Failed to link tour to crew:', error);
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">New Tour</Text>
          <Pressable onPress={handleAdd} disabled={!name.trim() || !artist.trim()}>
            <Text className={cn(
              "text-base font-semibold",
              name.trim() && artist.trim() ? "text-emerald-400" : "text-gray-600"
            )}>Create</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Tour Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Summer Arena Tour 2025"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Artist</Text>
            <TextInput
              value={artist}
              onChangeText={setArtist}
              placeholder="e.g., The Wavelengths"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <View className="flex-row gap-4 mb-5">
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">Start Date</Text>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">End Date</Text>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
          </View>

          {/* Crew Assignment */}
          {adminCrews.length > 0 && (
            <View className="mb-5">
              <Text className="text-gray-400 text-sm mb-2">Assign to Crew (Optional)</Text>
              <Pressable
                onPress={() => setShowCrewPicker(!showCrewPicker)}
                className="bg-[#1a1a2e] px-4 py-3 rounded-xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Users size={18} color={selectedCrew ? "#00d4aa" : "#6b7280"} />
                  <Text className={cn(
                    "ml-3 text-base",
                    selectedCrew ? "text-white" : "text-gray-500"
                  )}>
                    {selectedCrew ? selectedCrew.name : "Select a crew..."}
                  </Text>
                </View>
                <ChevronDown size={18} color="#6b7280" style={{ transform: [{ rotate: showCrewPicker ? '180deg' : '0deg' }] }} />
              </Pressable>

              {showCrewPicker && (
                <View className="mt-2 bg-[#1a1a2e] rounded-xl overflow-hidden">
                  <Pressable
                    onPress={() => {
                      setSelectedCrewId(undefined);
                      setShowCrewPicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={cn(
                      "px-4 py-3 flex-row items-center justify-between border-b border-white/5",
                      !selectedCrewId && "bg-emerald-500/10"
                    )}
                  >
                    <Text className={cn(
                      "text-base",
                      !selectedCrewId ? "text-emerald-400" : "text-gray-400"
                    )}>No crew assigned</Text>
                    {!selectedCrewId && <Check size={18} color="#00d4aa" />}
                  </Pressable>
                  {adminCrews.map((crew, index) => (
                    <Pressable
                      key={crew.id}
                      onPress={() => {
                        setSelectedCrewId(crew.id);
                        setShowCrewPicker(false);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className={cn(
                        "px-4 py-3 flex-row items-center justify-between",
                        index < adminCrews.length - 1 && "border-b border-white/5",
                        selectedCrewId === crew.id && "bg-emerald-500/10"
                      )}
                    >
                      <View>
                        <Text className={cn(
                          "text-base",
                          selectedCrewId === crew.id ? "text-emerald-400" : "text-white"
                        )}>{crew.name}</Text>
                        <Text className="text-gray-500 text-xs">{crew.artistName}</Text>
                      </View>
                      {selectedCrewId === crew.id && <Check size={18} color="#00d4aa" />}
                    </Pressable>
                  ))}
                </View>
              )}

              <Text className="text-gray-500 text-xs mt-2">
                Only crew members will be able to see this tour
              </Text>
            </View>
          )}

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Tour details, equipment notes..."
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[100px]"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function EditTourModal({
  tour,
  crews,
  crewMemberships,
  onClose,
  onSave
}: {
  tour: Tour;
  crews: Crew[];
  crewMemberships: Array<{ crew_id: string; role: 'admin' | 'member' }>;
  onClose: () => void;
  onSave: (tour: Tour) => void;
}) {
  const [name, setName] = useState(tour.name);
  const [artist, setArtist] = useState(tour.artist);
  const [startDate, setStartDate] = useState(tour.startDate);
  const [endDate, setEndDate] = useState(tour.endDate);
  const [notes, setNotes] = useState(tour.notes || '');
  const [status, setStatus] = useState<'active' | 'upcoming' | 'completed'>(tour.status);
  const [selectedCrewId, setSelectedCrewId] = useState<string | undefined>(tour.crewId);
  const [showCrewPicker, setShowCrewPicker] = useState(false);

  // Filter crews where user is admin
  const adminCrews = crews.filter(crew =>
    crewMemberships.some(m => m.crew_id === crew.id && m.role === 'admin')
  );

  const selectedCrew = adminCrews.find(c => c.id === selectedCrewId);

  const handleSave = async () => {
    if (!name.trim() || !artist.trim()) return;

    const updatedTour: Tour = {
      ...tour,
      name: name.trim(),
      artist: artist.trim(),
      startDate: startDate || tour.startDate,
      endDate: endDate || tour.endDate,
      status,
      notes: notes.trim(),
      crewId: selectedCrewId,
    };

    // Handle crew assignment changes
    if (selectedCrewId !== tour.crewId) {
      try {
        if (selectedCrewId) {
          await linkTourToCrew(tour.id, selectedCrewId);
          console.log('[Tours] Linked tour to crew:', selectedCrewId);
        } else if (tour.crewId) {
          await unlinkTourFromCrew(tour.id);
          console.log('[Tours] Unlinked tour from crew');
        }
      } catch (error) {
        console.error('[Tours] Failed to update crew assignment:', error);
      }
    }

    onSave(updatedTour);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Edit Tour</Text>
          <Pressable onPress={handleSave} disabled={!name.trim() || !artist.trim()}>
            <Text className={cn(
              "text-base font-semibold",
              name.trim() && artist.trim() ? "text-emerald-400" : "text-gray-600"
            )}>Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Tour Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Summer Arena Tour 2025"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Artist</Text>
            <TextInput
              value={artist}
              onChangeText={setArtist}
              placeholder="e.g., The Wavelengths"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Status</Text>
            <View className="flex-row gap-2">
              {(['upcoming', 'active', 'completed'] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStatus(s);
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl items-center",
                    status === s ? "bg-emerald-500" : "bg-[#1a1a2e]"
                  )}
                >
                  <Text className={cn(
                    "text-sm font-medium capitalize",
                    status === s ? "text-white" : "text-gray-400"
                  )}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="flex-row gap-4 mb-5">
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">Start Date</Text>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">End Date</Text>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
          </View>

          {/* Crew Assignment */}
          {adminCrews.length > 0 && (
            <View className="mb-5">
              <Text className="text-gray-400 text-sm mb-2">Assign to Crew</Text>
              <Pressable
                onPress={() => setShowCrewPicker(!showCrewPicker)}
                className="bg-[#1a1a2e] px-4 py-3 rounded-xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Users size={18} color={selectedCrew ? "#00d4aa" : "#6b7280"} />
                  <Text className={cn(
                    "ml-3 text-base",
                    selectedCrew ? "text-white" : "text-gray-500"
                  )}>
                    {selectedCrew ? selectedCrew.name : "No crew assigned"}
                  </Text>
                </View>
                <ChevronDown size={18} color="#6b7280" style={{ transform: [{ rotate: showCrewPicker ? '180deg' : '0deg' }] }} />
              </Pressable>

              {showCrewPicker && (
                <View className="mt-2 bg-[#1a1a2e] rounded-xl overflow-hidden">
                  <Pressable
                    onPress={() => {
                      setSelectedCrewId(undefined);
                      setShowCrewPicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={cn(
                      "px-4 py-3 flex-row items-center justify-between border-b border-white/5",
                      !selectedCrewId && "bg-emerald-500/10"
                    )}
                  >
                    <Text className={cn(
                      "text-base",
                      !selectedCrewId ? "text-emerald-400" : "text-gray-400"
                    )}>No crew assigned</Text>
                    {!selectedCrewId && <Check size={18} color="#00d4aa" />}
                  </Pressable>
                  {adminCrews.map((crew, index) => (
                    <Pressable
                      key={crew.id}
                      onPress={() => {
                        setSelectedCrewId(crew.id);
                        setShowCrewPicker(false);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className={cn(
                        "px-4 py-3 flex-row items-center justify-between",
                        index < adminCrews.length - 1 && "border-b border-white/5",
                        selectedCrewId === crew.id && "bg-emerald-500/10"
                      )}
                    >
                      <View>
                        <Text className={cn(
                          "text-base",
                          selectedCrewId === crew.id ? "text-emerald-400" : "text-white"
                        )}>{crew.name}</Text>
                        <Text className="text-gray-500 text-xs">{crew.artistName}</Text>
                      </View>
                      {selectedCrewId === crew.id && <Check size={18} color="#00d4aa" />}
                    </Pressable>
                  ))}
                </View>
              )}

              <Text className="text-gray-500 text-xs mt-2">
                Only crew members will be able to see this tour
              </Text>
            </View>
          )}

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Tour details, equipment notes..."
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[100px]"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AddShowModal({ tourId, onClose, onAdd }: { tourId: string; onClose: () => void; onAdd: (show: Show) => void }) {
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

  const isValid = venue.trim() && city.trim() && date.trim();

  const handleAdd = () => {
    if (!isValid) return;

    const show: Show = {
      id: `show-${Date.now()}`,
      tourId,
      venue: venue.trim(),
      city: city.trim(),
      state: state.trim() || '',
      country: 'USA',
      date: date.trim(),
      loadIn,
      soundcheck,
      doors,
      showTime,
      curfew,
      status: 'confirmed',
      venueContact: '',
      venuePhone: '',
      venueEmail: '',
      capacity: capacity ? parseInt(capacity) : 0,
      notes: notes.trim(),
    };

    onAdd(show);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Add Show</Text>
          <Pressable onPress={handleAdd} disabled={!isValid}>
            <Text className={cn(
              "text-base font-semibold",
              isValid ? "text-emerald-400" : "text-gray-600"
            )}>Add</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Venue Name *</Text>
            <TextInput
              value={venue}
              onChangeText={setVenue}
              placeholder="e.g., The Fillmore"
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
                placeholder="San Francisco"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            <View className="w-24">
              <Text className="text-gray-400 text-sm mb-2">State</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="CA"
                placeholderTextColor="#4b5563"
                autoCapitalize="characters"
                maxLength={2}
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-5">
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">Date *</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            <View className="w-28">
              <Text className="text-gray-400 text-sm mb-2">Capacity</Text>
              <TextInput
                value={capacity}
                onChangeText={setCapacity}
                placeholder="1000"
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
