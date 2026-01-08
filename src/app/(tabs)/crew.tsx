import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Linking, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  Users,
  Plus,
  Search,
  X,
  Phone,
  Mail,
  DollarSign,
  Award,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  MessageCircle,
  BadgeCheck,
  UserPlus,
  Send,
  Shield,
  Trash2,
  Upload,
  FileText,
  Image,
  Mic,
  Package,
  ChevronDown
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTourFlowStore, type CrewMember } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { inviteUserToTour, isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/cn';

const ROLES = [
  'FOH Engineer',
  'Monitor Engineer',
  'System Tech',
  'Stage Tech',
  'RF Tech',
  'Backline Tech',
  'Tour Manager',
  'Production Manager',
  'Stage Manager',
  'Lighting Designer',
  'Video Engineer',
  'Rigger',
  'Merch',
  'Driver',
  'Other'
];

export default function CrewScreen() {
  const crew = useTourFlowStore(s => s.crew);
  const tours = useTourFlowStore(s => s.tours);
  const addCrewMember = useTourFlowStore(s => s.addCrewMember);
  const updateCrewMember = useTourFlowStore(s => s.updateCrewMember);
  const deleteCrewMember = useTourFlowStore(s => s.deleteCrewMember);
  const { tourMemberships, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTourFilter, setSelectedTourFilter] = useState<string>('all');

  // Check if user is admin of any tour
  const isAdmin = tourMemberships.some(m => m.role === 'admin');
  const adminTours = tourMemberships.filter(m => m.role === 'admin');

  const filteredCrew = crew.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return '#00d4aa';
      case 'tentative': return '#f59e0b';
      case 'unavailable': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available': return CheckCircle;
      case 'tentative': return Clock;
      case 'unavailable': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const totalDayRate = crew
    .filter(c => c.availability === 'available')
    .reduce((acc, c) => acc + c.dayRate, 0);

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <LinearGradient
        colors={['#0f1419', '#0a0a0f']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-gray-500 text-sm font-medium tracking-wider uppercase">Tour Flow</Text>
              <Text className="text-white text-2xl font-bold mt-1">Crew</Text>
            </View>
            <View className="flex-row gap-2">
              {/* Upload Band Data Button (Admin only) */}
              {isAdmin && (
                <Pressable
                  onPress={() => setShowUploadModal(true)}
                  className="w-10 h-10 rounded-full bg-purple-500 items-center justify-center"
                >
                  <Upload size={18} color="#fff" strokeWidth={2.5} />
                </Pressable>
              )}
              {/* Invite Button (Admin only, when Supabase is configured) */}
              {isAdmin && isSupabaseConfigured() && (
                <Pressable
                  onPress={() => setShowInviteModal(true)}
                  className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
                >
                  <UserPlus size={18} color="#fff" strokeWidth={2.5} />
                </Pressable>
              )}
              <Pressable
                onPress={() => setShowAddModal(true)}
                className="w-10 h-10 rounded-full bg-emerald-500 items-center justify-center"
              >
                <Plus size={20} color="#fff" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Tour/Crew Filter */}
          {tours.length > 0 && (
            <View className="flex-row items-center bg-[#1a1a2e] rounded-xl px-4 py-3 mb-4">
              <Text className="text-gray-400 text-sm mr-2">Filter:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      setSelectedTourFilter('all');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg",
                      selectedTourFilter === 'all' ? "bg-emerald-500" : "bg-white/10"
                    )}
                  >
                    <Text className={cn(
                      "text-sm font-medium",
                      selectedTourFilter === 'all' ? "text-white" : "text-gray-400"
                    )}>All Crews</Text>
                  </Pressable>
                  {tours.map(tour => (
                    <Pressable
                      key={tour.id}
                      onPress={() => {
                        setSelectedTourFilter(tour.id);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg",
                        selectedTourFilter === tour.id ? "bg-emerald-500" : "bg-white/10"
                      )}
                    >
                      <Text className={cn(
                        "text-sm font-medium",
                        selectedTourFilter === tour.id ? "text-white" : "text-gray-400"
                      )}>{tour.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Search */}
          <View className="flex-row items-center bg-[#1a1a2e] rounded-xl px-4 py-3 mb-4">
            <Search size={18} color="#6b7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search crew..."
              placeholderTextColor="#6b7280"
              className="flex-1 text-white ml-3 text-base"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color="#6b7280" />
              </Pressable>
            )}
          </View>

          {/* Stats */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-3">
              <Users size={16} color="#8b5cf6" />
              <Text className="text-white font-bold text-lg mt-2">{crew.length}</Text>
              <Text className="text-gray-500 text-xs">Total Crew</Text>
            </View>
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-3">
              <CheckCircle size={16} color="#00d4aa" />
              <Text className="text-white font-bold text-lg mt-2">
                {crew.filter(c => c.availability === 'available').length}
              </Text>
              <Text className="text-gray-500 text-xs">Available</Text>
            </View>
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-3">
              <DollarSign size={16} color="#f59e0b" />
              <Text className="text-white font-bold text-lg mt-2">${totalDayRate}</Text>
              <Text className="text-gray-500 text-xs">Day Rate Total</Text>
            </View>
          </View>
        </View>

        {/* Crew List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {filteredCrew.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Users size={48} color="#374151" />
              <Text className="text-gray-500 mt-4 text-center">
                {searchQuery ? 'No crew members match your search' : 'No crew members yet'}
              </Text>
            </View>
          ) : (
            filteredCrew.map((member, index) => {
              const AvailIcon = getAvailabilityIcon(member.availability);
              const availColor = getAvailabilityColor(member.availability);

              return (
                <Animated.View
                  key={member.id}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedMember(selectedMember?.id === member.id ? null : member);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="mb-3"
                  >
                    <View className={cn(
                      "bg-[#1a1a2e] rounded-xl overflow-hidden",
                      selectedMember?.id === member.id && "border border-emerald-500/30"
                    )}>
                      <View className="p-4">
                        <View className="flex-row items-start">
                          {/* Avatar */}
                          <View className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 items-center justify-center mr-3">
                            <Text className="text-emerald-400 font-bold text-lg">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </Text>
                          </View>

                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <Text className="text-white font-bold">{member.name}</Text>
                              <AvailIcon size={14} color={availColor} className="ml-2" />
                            </View>
                            <Text className="text-gray-400 text-sm">{member.role}</Text>
                          </View>

                          <View className="items-end">
                            <Text className="text-emerald-400 font-semibold">${member.dayRate}</Text>
                            <Text className="text-gray-500 text-xs">day rate</Text>
                          </View>
                        </View>

                        {member.certifications.length > 0 && (
                          <View className="flex-row flex-wrap gap-1 mt-3">
                            {member.certifications.map((cert, i) => (
                              <View key={i} className="bg-amber-500/20 px-2 py-0.5 rounded-full flex-row items-center">
                                <Award size={10} color="#f59e0b" />
                                <Text className="text-amber-400 text-xs ml-1">{cert}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {member.credentials && (
                          <View className="flex-row items-center mt-2 bg-blue-500/10 px-2 py-1 rounded-lg self-start">
                            <BadgeCheck size={12} color="#3b82f6" />
                            <Text className="text-blue-400 text-xs ml-1">{member.credentials}</Text>
                          </View>
                        )}
                      </View>

                      {/* Expanded Details */}
                      {selectedMember?.id === member.id && (
                        <Animated.View
                          entering={FadeIn.duration(200)}
                          className="px-4 pb-4 pt-2 border-t border-white/10"
                        >
                          <View className="space-y-3">
                            <Pressable
                              onPress={() => Linking.openURL(`tel:${member.phone}`)}
                              className="flex-row items-center bg-white/5 p-3 rounded-lg"
                            >
                              <Phone size={16} color="#6b7280" />
                              <Text className="text-gray-300 ml-3 flex-1">{member.phone}</Text>
                              <ChevronRight size={16} color="#6b7280" />
                            </Pressable>

                            <Pressable
                              onPress={() => Linking.openURL(`mailto:${member.email}`)}
                              className="flex-row items-center bg-white/5 p-3 rounded-lg mt-2"
                            >
                              <Mail size={16} color="#6b7280" />
                              <Text className="text-gray-300 ml-3 flex-1">{member.email}</Text>
                              <ChevronRight size={16} color="#6b7280" />
                            </Pressable>

                            {member.notes && (
                              <View className="bg-white/5 p-3 rounded-lg mt-2">
                                <Text className="text-gray-500 text-xs uppercase mb-1">Notes</Text>
                                <Text className="text-gray-300">{member.notes}</Text>
                              </View>
                            )}

                            {member.credentials && (
                              <View className="bg-blue-500/10 p-3 rounded-lg mt-2">
                                <Text className="text-gray-500 text-xs uppercase mb-1">Credentials</Text>
                                <View className="flex-row items-center">
                                  <BadgeCheck size={14} color="#3b82f6" />
                                  <Text className="text-blue-400 ml-2">{member.credentials}</Text>
                                </View>
                              </View>
                            )}
                          </View>

                          <View className="flex-row gap-2 mt-4">
                            <Pressable
                              onPress={() => {
                                const nextAvail: CrewMember['availability'][] = ['available', 'tentative', 'unavailable'];
                                const currentIndex = nextAvail.indexOf(member.availability);
                                const next = nextAvail[(currentIndex + 1) % nextAvail.length];
                                updateCrewMember(member.id, { availability: next });
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              }}
                              className="flex-1 bg-white/5 py-2 rounded-lg flex-row items-center justify-center"
                            >
                              <AvailIcon size={14} color={availColor} />
                              <Text className="text-gray-400 text-sm ml-2 capitalize">{member.availability}</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => Linking.openURL(`sms:${member.phone}`)}
                              className="flex-1 bg-emerald-500/10 py-2 rounded-lg flex-row items-center justify-center"
                            >
                              <MessageCircle size={14} color="#00d4aa" />
                              <Text className="text-emerald-400 text-sm ml-2">Message</Text>
                            </Pressable>
                          </View>

                          {/* Remove Member Button (Admin only) */}
                          {isAdmin && (
                            <Pressable
                              onPress={() => {
                                deleteCrewMember(member.id);
                                setSelectedMember(null);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                              }}
                              className="mt-3 bg-red-500/10 border border-red-500/20 py-2 rounded-lg flex-row items-center justify-center"
                            >
                              <Trash2 size={14} color="#ef4444" />
                              <Text className="text-red-400 text-sm ml-2">Remove Member</Text>
                            </Pressable>
                          )}
                        </Animated.View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })
          )}

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>

      {/* Add Crew Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddCrewModal
          onClose={() => setShowAddModal(false)}
          onAdd={(member) => {
            addCrewMember(member);
            setShowAddModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      </Modal>

      {/* Invite User Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          adminTours={adminTours.map(m => ({
            id: m.tour_id,
            name: m.tour.name,
            artist: m.tour.artist,
          }))}
        />
      </Modal>

      {/* Upload Band Data Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <UploadBandDataModal
          onClose={() => setShowUploadModal(false)}
          tours={tours}
        />
      </Modal>
    </View>
  );
}

function AddCrewModal({ onClose, onAdd }: { onClose: () => void; onAdd: (member: CrewMember) => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('FOH Engineer');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dayRate, setDayRate] = useState('');
  const [credentials, setCredentials] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;

    const member: CrewMember = {
      id: `crew-${Date.now()}`,
      name: name.trim(),
      role,
      email: email.trim(),
      phone: phone.trim(),
      availability: 'available',
      certifications: [],
      dayRate: parseFloat(dayRate) || 0,
      notes: notes.trim(),
      credentials: credentials.trim() || undefined,
    };

    onAdd(member);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Add Crew Member</Text>
          <Pressable onPress={handleAdd} disabled={!name.trim()}>
            <Text className={cn(
              "text-base font-semibold",
              name.trim() ? "text-emerald-400" : "text-gray-600"
            )}>Add</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Alex Rivera"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {ROLES.map(r => (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    className={cn(
                      "px-4 py-2 rounded-full",
                      role === r ? "bg-emerald-500" : "bg-[#1a1a2e]"
                    )}
                  >
                    <Text className={cn(
                      "text-sm",
                      role === r ? "text-white font-medium" : "text-gray-400"
                    )}>
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="flex-row gap-4 mb-5">
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor="#4b5563"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
          </View>

          <View className="flex-row gap-4 mb-5">
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 555-0100"
                placeholderTextColor="#4b5563"
                keyboardType="phone-pad"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">Day Rate ($)</Text>
              <TextInput
                value={dayRate}
                onChangeText={setDayRate}
                placeholder="0"
                placeholderTextColor="#4b5563"
                keyboardType="numeric"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Credentials</Text>
            <TextInput
              value={credentials}
              onChangeText={setCredentials}
              placeholder="AAA All Access, Production Office, etc."
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Specialties, equipment preferences..."
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[80px]"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Invite User Modal for admins to invite crew by email
function InviteUserModal({
  onClose,
  adminTours,
}: {
  onClose: () => void;
  adminTours: Array<{ id: string; name: string; artist: string }>;
}) {
  const [email, setEmail] = useState('');
  const [selectedTourId, setSelectedTourId] = useState(adminTours[0]?.id || '');
  const [role, setRole] = useState<'admin' | 'crew'>('crew');
  const [canViewFinancials, setCanViewFinancials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInvite = async () => {
    if (!email.trim() || !selectedTourId) {
      setResult({ success: false, message: 'Please enter an email and select a tour' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setResult({ success: false, message: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    console.log('[Crew] Sending invitation to:', email.trim(), 'for tour:', selectedTourId, 'role:', role);

    try {
      const { error, invited } = await inviteUserToTour(
        email.trim(),
        selectedTourId,
        role,
        role === 'admin' ? true : canViewFinancials
      );

      if (error) {
        console.log('[Crew] Invitation error:', error.message);
        setResult({ success: false, message: error.message });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        const message = invited
          ? `Invitation sent to ${email}. They'll be added when they sign up.`
          : `${email} has been added to the tour!`;
        console.log('[Crew] Invitation success:', message);
        setResult({ success: true, message });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEmail('');
      }
    } catch (err) {
      console.error('[Crew] Invitation exception:', err);
      setResult({ success: false, message: 'Failed to send invitation. Please try again.' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Invite to Tour</Text>
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Info banner */}
          <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <UserPlus size={20} color="#3b82f6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-400 font-medium mb-1">Invite Crew Members</Text>
                <Text className="text-gray-400 text-sm">
                  Enter their email address. If they have an account, they'll be added immediately. Otherwise, they'll receive an invitation to sign up.
                </Text>
              </View>
            </View>
          </View>

          {/* Email input */}
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Email Address</Text>
            <View className="flex-row items-center bg-[#1a1a2e] rounded-xl px-4">
              <Mail size={18} color="#6b7280" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="crew@example.com"
                placeholderTextColor="#4b5563"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-white py-3 ml-3 text-base"
              />
            </View>
          </View>

          {/* Tour selection */}
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Add to Tour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View className="flex-row gap-2">
                {adminTours.map((tour) => (
                  <Pressable
                    key={tour.id}
                    onPress={() => setSelectedTourId(tour.id)}
                    className={cn(
                      'px-4 py-3 rounded-xl',
                      selectedTourId === tour.id ? 'bg-emerald-500' : 'bg-[#1a1a2e]'
                    )}
                  >
                    <Text
                      className={cn(
                        'font-medium',
                        selectedTourId === tour.id ? 'text-white' : 'text-gray-400'
                      )}
                    >
                      {tour.name}
                    </Text>
                    <Text
                      className={cn(
                        'text-xs mt-0.5',
                        selectedTourId === tour.id ? 'text-white/70' : 'text-gray-500'
                      )}
                    >
                      {tour.artist}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Role selection */}
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-2">Role</Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setRole('crew');
                  setCanViewFinancials(false);
                }}
                className={cn(
                  'flex-1 p-4 rounded-xl border',
                  role === 'crew'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-[#1a1a2e] border-transparent'
                )}
              >
                <Users size={20} color={role === 'crew' ? '#00d4aa' : '#6b7280'} />
                <Text
                  className={cn(
                    'font-medium mt-2',
                    role === 'crew' ? 'text-emerald-400' : 'text-gray-400'
                  )}
                >
                  Crew
                </Text>
                <Text className="text-gray-500 text-xs mt-1">View tour info, schedule, tasks</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setRole('admin');
                  setCanViewFinancials(true);
                }}
                className={cn(
                  'flex-1 p-4 rounded-xl border',
                  role === 'admin'
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-[#1a1a2e] border-transparent'
                )}
              >
                <Shield size={20} color={role === 'admin' ? '#3b82f6' : '#6b7280'} />
                <Text
                  className={cn(
                    'font-medium mt-2',
                    role === 'admin' ? 'text-blue-400' : 'text-gray-400'
                  )}
                >
                  Admin
                </Text>
                <Text className="text-gray-500 text-xs mt-1">Full access including financials</Text>
              </Pressable>
            </View>
          </View>

          {/* Financial access toggle (only for crew) */}
          {role === 'crew' && (
            <Pressable
              onPress={() => setCanViewFinancials(!canViewFinancials)}
              className={cn(
                'flex-row items-center p-4 rounded-xl mb-6 border',
                canViewFinancials
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-[#1a1a2e] border-transparent'
              )}
            >
              <DollarSign size={18} color={canViewFinancials ? '#f59e0b' : '#6b7280'} />
              <View className="flex-1 ml-3">
                <Text className={cn('font-medium', canViewFinancials ? 'text-amber-400' : 'text-gray-400')}>
                  Can View Financials
                </Text>
                <Text className="text-gray-500 text-xs mt-0.5">
                  Allow this crew member to see settlements
                </Text>
              </View>
              <View className={cn(
                'w-6 h-6 rounded-full items-center justify-center',
                canViewFinancials ? 'bg-amber-500' : 'bg-gray-600'
              )}>
                {canViewFinancials && <CheckCircle size={14} color="#fff" />}
              </View>
            </Pressable>
          )}

          {role === 'admin' && <View className="mb-6" />}

          {/* Result message */}
          {result && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className={cn(
                'p-4 rounded-xl mb-6',
                result.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
              )}
            >
              <View className="flex-row items-center">
                {result.success ? (
                  <CheckCircle size={18} color="#00d4aa" />
                ) : (
                  <AlertCircle size={18} color="#ef4444" />
                )}
                <Text
                  className={cn('ml-2 flex-1', result.success ? 'text-emerald-400' : 'text-red-400')}
                >
                  {result.message}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Send button */}
          <Pressable
            onPress={handleInvite}
            disabled={isLoading || !email.trim() || !selectedTourId}
            className={cn(
              'py-4 rounded-xl flex-row items-center justify-center',
              isLoading || !email.trim() || !selectedTourId ? 'bg-blue-500/30' : 'bg-blue-500'
            )}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send size={18} color="#fff" />
                <Text className="text-white font-semibold ml-2">Send Invitation</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

type UploadedFile = {
  type: 'rider' | 'input_list' | 'gear_list';
  uri: string;
  name: string;
  mimeType?: string;
};

type ParsedData = {
  rider?: {
    specs: string[];
    notes: string;
  };
  inputList?: Array<{
    channel: number;
    source: string;
    mic: string;
    notes?: string;
  }>;
  gearList?: Array<{
    name: string;
    category: string;
    condition: string;
    notes?: string;
  }>;
};

function UploadBandDataModal({
  onClose,
  tours,
}: {
  onClose: () => void;
  tours: Array<{ id: string; name: string; artist: string }>;
}) {
  const addGear = useTourFlowStore(s => s.addGear);
  const setInputList = useTourFlowStore(s => s.setInputList);

  const [selectedTourId, setSelectedTourId] = useState(tours[0]?.id || '');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [parsedData, setParsedData] = useState<ParsedData>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'review'>('upload');

  const pickImage = async (type: UploadedFile['type']) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadedFiles(prev => [
        ...prev.filter(f => f.type !== type),
        { type, uri: asset.uri, name: asset.fileName || `${type}.jpg`, mimeType: asset.mimeType }
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const pickDocument = async (type: UploadedFile['type']) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'text/csv'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadedFiles(prev => [
          ...prev.filter(f => f.type !== type),
          { type, uri: asset.uri, name: asset.name, mimeType: asset.mimeType }
        ]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const processUploads = async () => {
    setIsProcessing(true);

    // Simulate parsing - in production this would use OCR/AI
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockParsedData: ParsedData = {};

    // Check if rider was uploaded
    if (uploadedFiles.find(f => f.type === 'rider')) {
      mockParsedData.rider = {
        specs: [
          'Frequency Response: 27Hz - 20kHz',
          'Max SPL: 110dB',
          'Monitor Type: IEM Only',
          'Console: DiGiCo SD12 preferred',
          'Wedges: None (IEM only)',
        ],
        notes: 'All crew must have Shure PSM1000 compatible IEMs. No front fills.',
      };
    }

    // Check if input list was uploaded
    if (uploadedFiles.find(f => f.type === 'input_list')) {
      mockParsedData.inputList = [
        { channel: 1, source: 'Kick In', mic: 'Beta 91A', notes: 'Tape to beater side' },
        { channel: 2, source: 'Kick Out', mic: 'D112', notes: '' },
        { channel: 3, source: 'Snare Top', mic: 'SM57', notes: '' },
        { channel: 4, source: 'Snare Bottom', mic: 'SM57', notes: 'Phase flip' },
        { channel: 5, source: 'Hi-Hat', mic: 'KSM137', notes: '' },
        { channel: 6, source: 'Rack Tom', mic: 'e604', notes: '' },
        { channel: 7, source: 'Floor Tom', mic: 'e604', notes: '' },
        { channel: 8, source: 'OH L', mic: 'KSM32', notes: 'X/Y pair' },
        { channel: 9, source: 'OH R', mic: 'KSM32', notes: '' },
        { channel: 10, source: 'Bass DI', mic: 'Radial J48', notes: 'Post-EQ' },
        { channel: 11, source: 'Bass Amp', mic: 'RE20', notes: '' },
        { channel: 12, source: 'Gtr L Amp', mic: 'SM57', notes: 'Cap edge' },
        { channel: 13, source: 'Gtr R Amp', mic: 'e609', notes: '' },
        { channel: 14, source: 'Keys L', mic: 'DI', notes: 'Stereo' },
        { channel: 15, source: 'Keys R', mic: 'DI', notes: '' },
        { channel: 16, source: 'Vox Lead', mic: 'SM58', notes: 'Comp at FOH' },
      ];
    }

    // Check if gear list was uploaded
    if (uploadedFiles.find(f => f.type === 'gear_list')) {
      mockParsedData.gearList = [
        { name: 'DiGiCo SD12', category: 'console', condition: 'excellent', notes: 'Main FOH console' },
        { name: 'Shure SM58', category: 'mics', condition: 'good', notes: 'Qty: 4' },
        { name: 'Shure Beta 91A', category: 'mics', condition: 'excellent', notes: 'Kick drum' },
        { name: 'Radial J48 DI', category: 'di', condition: 'good', notes: 'Qty: 6' },
        { name: 'Shure PSM1000', category: 'iem', condition: 'excellent', notes: 'Qty: 8 packs' },
        { name: 'XLR 50ft', category: 'cables', condition: 'good', notes: 'Qty: 24' },
        { name: 'Shure ULXD4Q', category: 'rf', condition: 'excellent', notes: 'Wireless rack' },
      ];
    }

    setParsedData(mockParsedData);
    setActiveTab('review');
    setIsProcessing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const applyParsedData = () => {
    // Apply input list
    if (parsedData.inputList && parsedData.inputList.length > 0) {
      const inputChannels = parsedData.inputList.map(item => ({
        channel: item.channel,
        source: item.source,
        mic: item.mic,
        stand: 'Short boom',
        notes: item.notes || '',
        phantom: item.mic.includes('KSM') || item.mic.includes('DI'),
        pad: false,
      }));
      setInputList(inputChannels);
    }

    // Apply gear list
    if (parsedData.gearList && parsedData.gearList.length > 0) {
      parsedData.gearList.forEach(item => {
        addGear({
          id: `gear-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          category: item.category as any,
          packNumber: 'PACK-1',
          height: 0,
          width: 0,
          length: 0,
          weight: 0,
          location: 'FOH',
          condition: item.condition as any,
          notes: item.notes || '',
          flyPack: false,
        });
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const getFileForType = (type: UploadedFile['type']) => uploadedFiles.find(f => f.type === type);

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Upload Band Data</Text>
          <View className="w-6" />
        </View>

        {/* Tabs */}
        <View className="flex-row mx-5 mt-4 bg-[#1a1a2e] rounded-xl p-1">
          <Pressable
            onPress={() => setActiveTab('upload')}
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              activeTab === 'upload' ? "bg-purple-500" : ""
            )}
          >
            <Text className={activeTab === 'upload' ? "text-white font-medium" : "text-gray-400"}>
              Upload
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('review')}
            disabled={Object.keys(parsedData).length === 0}
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              activeTab === 'review' ? "bg-purple-500" : ""
            )}
          >
            <Text className={activeTab === 'review' ? "text-white font-medium" : "text-gray-400"}>
              Review
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          {activeTab === 'upload' ? (
            <>
              {/* Tour selection */}
              {tours.length > 1 && (
                <View className="mb-6">
                  <Text className="text-gray-400 text-sm mb-2">Apply to Tour</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View className="flex-row gap-2">
                      {tours.map((tour) => (
                        <Pressable
                          key={tour.id}
                          onPress={() => setSelectedTourId(tour.id)}
                          className={cn(
                            'px-4 py-2 rounded-lg',
                            selectedTourId === tour.id ? 'bg-purple-500' : 'bg-[#1a1a2e]'
                          )}
                        >
                          <Text className={selectedTourId === tour.id ? 'text-white font-medium' : 'text-gray-400'}>
                            {tour.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Info banner */}
              <View className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
                <View className="flex-row items-start">
                  <Upload size={20} color="#a855f7" />
                  <View className="flex-1 ml-3">
                    <Text className="text-purple-400 font-medium mb-1">Upload Band Documents</Text>
                    <Text className="text-gray-400 text-sm">
                      Upload rider specs, input lists, and gear inventories. We'll extract the data automatically.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Upload sections */}
              <UploadSection
                title="Technical Rider"
                description="FOH specs, monitor requirements, stage plot"
                icon={FileText}
                color="#3b82f6"
                file={getFileForType('rider')}
                onPickImage={() => pickImage('rider')}
                onPickDocument={() => pickDocument('rider')}
                onRemove={() => setUploadedFiles(prev => prev.filter(f => f.type !== 'rider'))}
              />

              <UploadSection
                title="Input List"
                description="Channel assignments, mic selections, DI info"
                icon={Mic}
                color="#22c55e"
                file={getFileForType('input_list')}
                onPickImage={() => pickImage('input_list')}
                onPickDocument={() => pickDocument('input_list')}
                onRemove={() => setUploadedFiles(prev => prev.filter(f => f.type !== 'input_list'))}
              />

              <UploadSection
                title="Gear List"
                description="Equipment inventory, cases, weights"
                icon={Package}
                color="#f59e0b"
                file={getFileForType('gear_list')}
                onPickImage={() => pickImage('gear_list')}
                onPickDocument={() => pickDocument('gear_list')}
                onRemove={() => setUploadedFiles(prev => prev.filter(f => f.type !== 'gear_list'))}
              />

              {/* Process button */}
              {uploadedFiles.length > 0 && (
                <Pressable
                  onPress={processUploads}
                  disabled={isProcessing}
                  className={cn(
                    "py-4 rounded-xl flex-row items-center justify-center mt-4",
                    isProcessing ? "bg-purple-500/50" : "bg-purple-500"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <ActivityIndicator color="#fff" />
                      <Text className="text-white font-semibold ml-2">Processing...</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={18} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Process {uploadedFiles.length} File{uploadedFiles.length > 1 ? 's' : ''}</Text>
                    </>
                  )}
                </Pressable>
              )}
            </>
          ) : (
            <>
              {/* Review parsed data */}
              {parsedData.rider && (
                <View className="bg-[#1a1a2e] rounded-xl p-4 mb-4">
                  <View className="flex-row items-center mb-3">
                    <FileText size={18} color="#3b82f6" />
                    <Text className="text-white font-semibold ml-2">Technical Rider</Text>
                  </View>
                  {parsedData.rider.specs.map((spec, i) => (
                    <Text key={i} className="text-gray-400 text-sm mb-1">• {spec}</Text>
                  ))}
                  {parsedData.rider.notes && (
                    <View className="mt-3 pt-3 border-t border-white/10">
                      <Text className="text-gray-500 text-xs uppercase mb-1">Notes</Text>
                      <Text className="text-gray-400 text-sm">{parsedData.rider.notes}</Text>
                    </View>
                  )}
                </View>
              )}

              {parsedData.inputList && parsedData.inputList.length > 0 && (
                <View className="bg-[#1a1a2e] rounded-xl p-4 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Mic size={18} color="#22c55e" />
                    <Text className="text-white font-semibold ml-2">Input List ({parsedData.inputList.length} channels)</Text>
                  </View>
                  {parsedData.inputList.slice(0, 8).map((ch, i) => (
                    <View key={i} className="flex-row items-center py-2 border-b border-white/5">
                      <Text className="text-emerald-400 w-8">{ch.channel}</Text>
                      <Text className="text-white flex-1">{ch.source}</Text>
                      <Text className="text-gray-400">{ch.mic}</Text>
                    </View>
                  ))}
                  {parsedData.inputList.length > 8 && (
                    <Text className="text-gray-500 text-sm mt-2">+ {parsedData.inputList.length - 8} more channels</Text>
                  )}
                </View>
              )}

              {parsedData.gearList && parsedData.gearList.length > 0 && (
                <View className="bg-[#1a1a2e] rounded-xl p-4 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Package size={18} color="#f59e0b" />
                    <Text className="text-white font-semibold ml-2">Gear List ({parsedData.gearList.length} items)</Text>
                  </View>
                  {parsedData.gearList.map((item, i) => (
                    <View key={i} className="flex-row items-center py-2 border-b border-white/5">
                      <Text className="text-white flex-1">{item.name}</Text>
                      <View className="px-2 py-0.5 rounded bg-white/10">
                        <Text className="text-gray-400 text-xs capitalize">{item.category}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Apply button */}
              <Pressable
                onPress={applyParsedData}
                className="bg-emerald-500 py-4 rounded-xl flex-row items-center justify-center mt-4"
              >
                <CheckCircle size={18} color="#fff" />
                <Text className="text-white font-semibold ml-2">Apply to Tour</Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('upload')}
                className="bg-[#1a1a2e] py-3 rounded-xl items-center mt-3"
              >
                <Text className="text-gray-400">Back to Upload</Text>
              </Pressable>
            </>
          )}

          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function UploadSection({
  title,
  description,
  icon: Icon,
  color,
  file,
  onPickImage,
  onPickDocument,
  onRemove,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  file?: UploadedFile;
  onPickImage: () => void;
  onPickDocument: () => void;
  onRemove: () => void;
}) {
  return (
    <View className="bg-[#1a1a2e] rounded-xl p-4 mb-4">
      <View className="flex-row items-start mb-3">
        <View className="w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon size={20} color={color} />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold">{title}</Text>
          <Text className="text-gray-500 text-sm">{description}</Text>
        </View>
      </View>

      {file ? (
        <View className="flex-row items-center bg-white/5 rounded-lg p-3">
          <CheckCircle size={16} color="#22c55e" />
          <Text className="text-gray-300 flex-1 ml-2" numberOfLines={1}>{file.name}</Text>
          <Pressable onPress={onRemove} className="p-1">
            <X size={16} color="#6b7280" />
          </Pressable>
        </View>
      ) : (
        <View className="flex-row gap-2">
          <Pressable
            onPress={onPickImage}
            className="flex-1 flex-row items-center justify-center py-3 rounded-lg bg-white/5"
          >
            <Image size={16} color="#9ca3af" />
            <Text className="text-gray-400 ml-2">Image</Text>
          </Pressable>
          <Pressable
            onPress={onPickDocument}
            className="flex-1 flex-row items-center justify-center py-3 rounded-lg bg-white/5"
          >
            <FileText size={16} color="#9ca3af" />
            <Text className="text-gray-400 ml-2">PDF/Text</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
