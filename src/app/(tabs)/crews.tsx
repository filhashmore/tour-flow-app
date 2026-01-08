import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Users,
  Music,
  FileText,
  ChevronRight,
  Search,
  X,
  Check,
  UserPlus,
  MoreHorizontal,
  Trash2,
  Edit3,
  Crown,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTourFlowStore, type Crew, type CrewMemberLink, type CrewDocument } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';
import {
  createCrew as createCrewApi,
  updateCrew as updateCrewApi,
  deleteCrew as deleteCrewApi,
  inviteUserToCrew,
  removeCrewMember,
  getCrewMembers,
  getCrewDocuments,
} from '@/lib/supabase';

export default function CrewsScreen() {
  const router = useRouter();
  const crews = useTourFlowStore(s => s.crews);
  const activeCrew = useTourFlowStore(s => s.activeCrew);
  const setActiveCrew = useTourFlowStore(s => s.setActiveCrew);
  const addCrew = useTourFlowStore(s => s.addCrew);
  const updateCrew = useTourFlowStore(s => s.updateCrew);
  const deleteCrew = useTourFlowStore(s => s.deleteCrew);
  const tours = useTourFlowStore(s => s.tours);
  const canEdit = useTourFlowStore(s => s.canEdit);

  const { user, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCrewModal, setShowAddCrewModal] = useState(false);
  const [showCrewDetailModal, setShowCrewDetailModal] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredCrews = useMemo(() => {
    if (!searchQuery.trim()) return crews;
    const q = searchQuery.toLowerCase();
    return crews.filter(
      c => c.name.toLowerCase().includes(q) || c.artistName.toLowerCase().includes(q)
    );
  }, [crews, searchQuery]);

  const isCrewAdmin = useCallback((crew: Crew) => {
    if (!user?.id) return canEdit();
    const member = crew.members.find(m => m.userId === user.id);
    return member?.role === 'admin';
  }, [user?.id, canEdit]);

  const getCrewTours = useCallback((crewId: string) => {
    return tours.filter(t => t.crewId === crewId);
  }, [tours]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCrewPress = (crew: Crew) => {
    setSelectedCrew(crew);
    setShowCrewDetailModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectCrew = (crew: Crew | null) => {
    setActiveCrew(crew);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <LinearGradient
        colors={['#0f1419', '#0a0a0a']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-gray-500 text-xs font-medium tracking-wider uppercase">Manage</Text>
              <Text className="text-white text-2xl font-bold">Crews</Text>
            </View>
            {canEdit() && (
              <Pressable
                onPress={() => {
                  setShowAddCrewModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="bg-emerald-500 w-10 h-10 rounded-full items-center justify-center"
              >
                <Plus size={20} color="#fff" strokeWidth={2.5} />
              </Pressable>
            )}
          </View>

          {/* Search */}
          <View className="mt-4 flex-row items-center bg-[#1a1a2e] rounded-xl px-4 py-3">
            <Search size={18} color="#6b7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search crews..."
              placeholderTextColor="#6b7280"
              className="flex-1 text-white ml-3 text-base"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color="#6b7280" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Active Crew Filter */}
        {activeCrew && (
          <Animated.View entering={FadeIn.duration(300)} className="px-5 mt-2">
            <Pressable
              onPress={() => handleSelectCrew(null)}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex-row items-center"
            >
              <View className="w-8 h-8 rounded-lg bg-emerald-500/20 items-center justify-center mr-3">
                <Users size={16} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-emerald-400 text-xs uppercase tracking-wider">Active Crew</Text>
                <Text className="text-white font-semibold">{activeCrew.name}</Text>
              </View>
              <View className="bg-white/10 px-3 py-1 rounded-full">
                <Text className="text-gray-400 text-xs">Tap to clear</Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Crews List */}
        <ScrollView
          className="flex-1 px-5 mt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#22c55e"
            />
          }
        >
          {filteredCrews.length === 0 ? (
            <View className="items-center justify-center py-16">
              <View className="w-16 h-16 rounded-full bg-[#1a1a2e] items-center justify-center mb-4">
                <Users size={28} color="#374151" />
              </View>
              <Text className="text-gray-500 text-center">
                {searchQuery ? 'No crews match your search' : 'No crews yet'}
              </Text>
              {canEdit() && !searchQuery && (
                <Pressable
                  onPress={() => setShowAddCrewModal(true)}
                  className="mt-4 bg-emerald-500/20 px-4 py-2 rounded-full"
                >
                  <Text className="text-emerald-400 font-medium">Create Your First Crew</Text>
                </Pressable>
              )}
            </View>
          ) : (
            filteredCrews.map((crew, index) => (
              <Animated.View
                key={crew.id}
                entering={FadeInDown.delay(index * 50).duration(400)}
              >
                <CrewCard
                  crew={crew}
                  isActive={activeCrew?.id === crew.id}
                  isAdmin={isCrewAdmin(crew)}
                  tourCount={getCrewTours(crew.id).length}
                  onPress={() => handleCrewPress(crew)}
                  onSelect={() => handleSelectCrew(crew.id === activeCrew?.id ? null : crew)}
                />
              </Animated.View>
            ))
          )}
          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>

      {/* Add Crew Modal */}
      <Modal
        visible={showAddCrewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddCrewModal(false)}
      >
        <AddCrewModal
          userId={user?.id}
          onClose={() => setShowAddCrewModal(false)}
          onAdd={(crew) => {
            addCrew(crew);
            setShowAddCrewModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      </Modal>

      {/* Crew Detail Modal */}
      <Modal
        visible={showCrewDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCrewDetailModal(false)}
      >
        {selectedCrew && (
          <CrewDetailModal
            crew={selectedCrew}
            isAdmin={isCrewAdmin(selectedCrew)}
            tours={getCrewTours(selectedCrew.id)}
            userId={user?.id}
            onClose={() => setShowCrewDetailModal(false)}
            onUpdate={(updates) => {
              updateCrew(selectedCrew.id, updates);
              setSelectedCrew({ ...selectedCrew, ...updates });
            }}
            onDelete={() => {
              deleteCrew(selectedCrew.id);
              setShowCrewDetailModal(false);
              if (activeCrew?.id === selectedCrew.id) {
                setActiveCrew(null);
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }}
            onNavigateToTour={(tourId) => {
              setShowCrewDetailModal(false);
              router.push({ pathname: '/tour-detail', params: { tourId } });
            }}
          />
        )}
      </Modal>
    </View>
  );
}

function CrewCard({
  crew,
  isActive,
  isAdmin,
  tourCount,
  onPress,
  onSelect,
}: {
  crew: Crew;
  isActive: boolean;
  isAdmin: boolean;
  tourCount: number;
  onPress: () => void;
  onSelect: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mb-3">
      <View
        className={cn(
          'bg-[#1a1a2e] rounded-xl p-4',
          isActive && 'border border-emerald-500/30'
        )}
      >
        <View className="flex-row items-start">
          <View className="w-12 h-12 rounded-xl bg-emerald-500/20 items-center justify-center mr-3">
            <Users size={22} color={isActive ? '#22c55e' : '#6b7280'} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-white font-semibold text-base">{crew.name}</Text>
              {isAdmin && (
                <View className="ml-2 bg-amber-500/20 px-2 py-0.5 rounded-full flex-row items-center">
                  <Crown size={10} color="#f59e0b" />
                  <Text className="text-amber-400 text-xs ml-1">Admin</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-400 text-sm">{crew.artistName}</Text>
            <View className="flex-row items-center mt-2 gap-3">
              <View className="flex-row items-center">
                <Users size={12} color="#6b7280" />
                <Text className="text-gray-500 text-xs ml-1">
                  {crew.members.length} member{crew.members.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Music size={12} color="#6b7280" />
                <Text className="text-gray-500 text-xs ml-1">
                  {tourCount} tour{tourCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <View className="flex-row items-center">
                <FileText size={12} color="#6b7280" />
                <Text className="text-gray-500 text-xs ml-1">
                  {crew.documents.length} doc{crew.documents.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={cn(
              'w-8 h-8 rounded-full items-center justify-center',
              isActive ? 'bg-emerald-500' : 'bg-white/10'
            )}
          >
            {isActive ? (
              <Check size={16} color="#fff" strokeWidth={2.5} />
            ) : (
              <ChevronRight size={16} color="#6b7280" />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function AddCrewModal({
  userId,
  onClose,
  onAdd,
}: {
  userId?: string;
  onClose: () => void;
  onAdd: (crew: Crew) => void;
}) {
  const [name, setName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !artistName.trim()) return;

    setIsSubmitting(true);

    const now = new Date().toISOString();
    const newCrew: Crew = {
      id: `crew-${Date.now()}`,
      name: name.trim(),
      artistName: artistName.trim(),
      createdAt: now,
      updatedAt: now,
      members: userId ? [{
        id: `member-${Date.now()}`,
        crewId: `crew-${Date.now()}`,
        userId: userId,
        role: 'admin',
        email: '',
        name: 'You',
        joinedAt: now,
      }] : [],
      documents: [],
    };

    // Try to create in Supabase if authenticated
    if (userId) {
      const { data, error } = await createCrewApi({
        name: newCrew.name,
        artist_name: newCrew.artistName,
      }, userId);

      if (data && !error) {
        newCrew.id = data.id;
        newCrew.members[0].crewId = data.id;
      }
    }

    setIsSubmitting(false);
    onAdd(newCrew);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">New Crew</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!name.trim() || !artistName.trim() || isSubmitting}
            className={cn(
              'px-4 py-2 rounded-lg',
              name.trim() && artistName.trim() && !isSubmitting ? 'bg-emerald-500' : 'bg-gray-700'
            )}
          >
            <Text className={cn(
              'font-semibold',
              name.trim() && artistName.trim() && !isSubmitting ? 'text-white' : 'text-gray-500'
            )}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <Text className="text-gray-500 text-sm mb-6">
            A crew represents a band or artist team. Members will have access to shared documents like riders, input lists, and stage plots.
          </Text>

          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2">Crew Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Main Stage Crew"
              placeholderTextColor="#6b7280"
              className="bg-[#1a1a2e] rounded-xl px-4 py-4 text-white text-base"
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2">Band / Artist Name *</Text>
            <TextInput
              value={artistName}
              onChangeText={setArtistName}
              placeholder="e.g., The Band"
              placeholderTextColor="#6b7280"
              className="bg-[#1a1a2e] rounded-xl px-4 py-4 text-white text-base"
            />
          </View>

          <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <Text className="text-emerald-400 font-medium mb-2">You will be the admin</Text>
            <Text className="text-gray-400 text-sm">
              As the creator, you will automatically become an admin of this crew with full management permissions.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function CrewDetailModal({
  crew,
  isAdmin,
  tours,
  userId,
  onClose,
  onUpdate,
  onDelete,
  onNavigateToTour,
}: {
  crew: Crew;
  isAdmin: boolean;
  tours: Array<{ id: string; name: string; artist: string; status: string }>;
  userId?: string;
  onClose: () => void;
  onUpdate: (updates: Partial<Crew>) => void;
  onDelete: () => void;
  onNavigateToTour: (tourId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'members' | 'documents' | 'tours'>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const addCrewMemberLink = useTourFlowStore(s => s.addCrewMemberLink);
  const removeCrewMemberLink = useTourFlowStore(s => s.removeCrewMemberLink);

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === userId) return; // Can't remove yourself

    // Remove from Supabase
    await removeCrewMember(crew.id, memberUserId);

    // Remove from local store
    removeCrewMemberLink(crew.id, memberId);
    onUpdate({
      members: crew.members.filter(m => m.id !== memberId),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const tabs = [
    { id: 'members' as const, label: 'Members', count: crew.members.length },
    { id: 'documents' as const, label: 'Documents', count: crew.documents.length },
    { id: 'tours' as const, label: 'Tours', count: tours.length },
  ];

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">{crew.name}</Text>
          {isAdmin && (
            <Pressable
              onPress={() => setShowEditModal(true)}
              className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
            >
              <MoreHorizontal size={18} color="#6b7280" />
            </Pressable>
          )}
        </View>

        {/* Crew Info */}
        <View className="px-5 py-4 bg-[#1a1a2e]/50">
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-xl bg-emerald-500/20 items-center justify-center mr-4">
              <Users size={26} color="#22c55e" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">{crew.artistName}</Text>
              <Text className="text-gray-400 text-sm">
                Created {new Date(crew.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {isAdmin && (
              <Pressable
                onPress={() => setShowInviteModal(true)}
                className="bg-emerald-500 px-3 py-2 rounded-lg flex-row items-center"
              >
                <UserPlus size={16} color="#fff" />
                <Text className="text-white font-medium ml-2">Invite</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row px-5 pt-4 gap-2">
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => {
                setActiveTab(tab.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                'flex-1 py-3 rounded-xl items-center',
                activeTab === tab.id ? 'bg-emerald-500/20' : 'bg-[#1a1a2e]'
              )}
            >
              <Text
                className={cn(
                  'font-medium',
                  activeTab === tab.id ? 'text-emerald-400' : 'text-gray-500'
                )}
              >
                {tab.label}
              </Text>
              <Text
                className={cn(
                  'text-xs mt-0.5',
                  activeTab === tab.id ? 'text-emerald-400/70' : 'text-gray-600'
                )}
              >
                {tab.count}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView className="flex-1 px-5 pt-4">
          {activeTab === 'members' && (
            <MembersTab
              members={crew.members}
              isAdmin={isAdmin}
              currentUserId={userId}
              onRemove={handleRemoveMember}
            />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab
              documents={crew.documents}
              isAdmin={isAdmin}
              crewId={crew.id}
            />
          )}
          {activeTab === 'tours' && (
            <ToursTab
              tours={tours}
              onSelectTour={onNavigateToTour}
            />
          )}
          <View className="h-24" />
        </ScrollView>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <View className="absolute inset-0 bg-black/80 items-center justify-center px-8">
            <View className="bg-[#1a1a2e] rounded-2xl p-6 w-full">
              <Text className="text-white text-lg font-bold text-center mb-2">Delete Crew?</Text>
              <Text className="text-gray-400 text-center mb-6">
                This will permanently delete "{crew.name}" and remove all members. This action cannot be undone.
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white/10 py-3 rounded-xl items-center"
                >
                  <Text className="text-white font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    onDelete();
                  }}
                  className="flex-1 bg-red-500 py-3 rounded-xl items-center"
                >
                  <Text className="text-white font-semibold">Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <InviteMemberModal
          crewId={crew.id}
          onClose={() => setShowInviteModal(false)}
          onInvited={(member) => {
            addCrewMemberLink(crew.id, member);
            onUpdate({
              members: [...crew.members, member],
            });
            setShowInviteModal(false);
          }}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <EditCrewModal
          crew={crew}
          onClose={() => setShowEditModal(false)}
          onSave={(updates) => {
            onUpdate(updates);
            setShowEditModal(false);
          }}
          onDelete={() => {
            setShowEditModal(false);
            setShowDeleteConfirm(true);
          }}
        />
      </Modal>
    </View>
  );
}

function MembersTab({
  members,
  isAdmin,
  currentUserId,
  onRemove,
}: {
  members: CrewMemberLink[];
  isAdmin: boolean;
  currentUserId?: string;
  onRemove: (memberId: string, userId: string) => void;
}) {
  if (members.length === 0) {
    return (
      <View className="items-center py-12">
        <Users size={48} color="#374151" />
        <Text className="text-gray-500 mt-4">No members yet</Text>
      </View>
    );
  }

  return (
    <View>
      {members.map((member) => (
        <View
          key={member.id}
          className="bg-[#1a1a2e] rounded-xl p-4 mb-3 flex-row items-center"
        >
          <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
            <Text className="text-emerald-400 font-bold">
              {member.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-white font-medium">{member.name}</Text>
              {member.userId === currentUserId && (
                <Text className="text-gray-500 text-xs ml-2">(You)</Text>
              )}
            </View>
            <Text className="text-gray-500 text-sm">{member.email || member.jobTitle || member.role}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {member.role === 'admin' && (
              <View className="bg-amber-500/20 px-2 py-1 rounded-full">
                <Text className="text-amber-400 text-xs">Admin</Text>
              </View>
            )}
            {isAdmin && member.userId !== currentUserId && (
              <Pressable
                onPress={() => onRemove(member.id, member.userId)}
                className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center"
              >
                <Trash2 size={14} color="#ef4444" />
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

function DocumentsTab({
  documents,
  isAdmin,
  crewId,
}: {
  documents: CrewDocument[];
  isAdmin: boolean;
  crewId: string;
}) {
  const router = useRouter();

  if (documents.length === 0) {
    return (
      <View className="items-center py-12">
        <FileText size={48} color="#374151" />
        <Text className="text-gray-500 mt-4">No documents yet</Text>
        {isAdmin && (
          <Pressable
            onPress={() => {
              router.push({ pathname: '/documents', params: { crewId } });
            }}
            className="mt-4 bg-emerald-500/20 px-4 py-2 rounded-full"
          >
            <Text className="text-emerald-400 font-medium">Add Document</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'rider': return '📋';
      case 'input_list': return '🎚️';
      case 'stage_plot': return '📐';
      case 'tech_spec': return '🔧';
      default: return '📄';
    }
  };

  return (
    <View>
      {documents.map((doc) => (
        <View
          key={doc.id}
          className="bg-[#1a1a2e] rounded-xl p-4 mb-3 flex-row items-center"
        >
          <View className="w-10 h-10 rounded-lg bg-blue-500/20 items-center justify-center mr-3">
            <Text className="text-lg">{getDocIcon(doc.type)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-medium">{doc.name}</Text>
            <Text className="text-gray-500 text-sm capitalize">{doc.type.replace('_', ' ')}</Text>
          </View>
          <ChevronRight size={18} color="#6b7280" />
        </View>
      ))}
    </View>
  );
}

function ToursTab({
  tours,
  onSelectTour,
}: {
  tours: Array<{ id: string; name: string; artist: string; status: string }>;
  onSelectTour: (tourId: string) => void;
}) {
  if (tours.length === 0) {
    return (
      <View className="items-center py-12">
        <Music size={48} color="#374151" />
        <Text className="text-gray-500 mt-4">No tours linked to this crew</Text>
        <Text className="text-gray-600 text-xs text-center mt-2 px-8">
          Link tours to this crew from the tour settings to share crew documents
        </Text>
      </View>
    );
  }

  return (
    <View>
      {tours.map((tour) => (
        <Pressable
          key={tour.id}
          onPress={() => onSelectTour(tour.id)}
          className="bg-[#1a1a2e] rounded-xl p-4 mb-3 flex-row items-center"
        >
          <View className="w-10 h-10 rounded-lg bg-purple-500/20 items-center justify-center mr-3">
            <Music size={18} color="#a855f7" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-medium">{tour.name}</Text>
            <Text className="text-gray-500 text-sm">{tour.artist}</Text>
          </View>
          <View
            className={cn(
              'px-2 py-1 rounded-full',
              tour.status === 'active' ? 'bg-emerald-500/20' : 'bg-gray-500/20'
            )}
          >
            <Text
              className={cn(
                'text-xs capitalize',
                tour.status === 'active' ? 'text-emerald-400' : 'text-gray-400'
              )}
            >
              {tour.status}
            </Text>
          </View>
          <View style={{ marginLeft: 8 }}>
            <ChevronRight size={18} color="#6b7280" />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function InviteMemberModal({
  crewId,
  onClose,
  onInvited,
}: {
  crewId: string;
  onClose: () => void;
  onInvited: (member: CrewMemberLink) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [jobTitle, setJobTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async () => {
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError('');

    // Check if crewId is a valid UUID (not a local ID like "crew-123456")
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(crewId);

    if (!isValidUUID) {
      // Local crew - just add member locally without database call
      const newMember: CrewMemberLink = {
        id: `member-${Date.now()}`,
        crewId,
        userId: '',
        role,
        email: email.trim(),
        name: email.trim().split('@')[0],
        jobTitle: jobTitle.trim() || undefined,
        joinedAt: new Date().toISOString(),
      };
      setIsSubmitting(false);
      onInvited(newMember);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    const { data, error: inviteError } = await inviteUserToCrew(
      email.trim(),
      crewId,
      role,
      jobTitle.trim() || undefined
    );

    setIsSubmitting(false);

    if (inviteError) {
      setError(inviteError.message);
      return;
    }

    const newMember: CrewMemberLink = {
      id: data?.id || `member-${Date.now()}`,
      crewId,
      userId: '',
      role,
      email: email.trim(),
      name: email.trim().split('@')[0],
      jobTitle: jobTitle.trim() || undefined,
      joinedAt: new Date().toISOString(),
    };

    onInvited(newMember);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Invite Member</Text>
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2">Email Address *</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="crew@example.com"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-[#1a1a2e] rounded-xl px-4 py-4 text-white text-base"
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2">Job Title (Optional)</Text>
            <TextInput
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="e.g., FOH Engineer"
              placeholderTextColor="#6b7280"
              className="bg-[#1a1a2e] rounded-xl px-4 py-4 text-white text-base"
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2">Role</Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setRole('member')}
                className={cn(
                  'flex-1 py-3 rounded-xl items-center border',
                  role === 'member'
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-[#1a1a2e] border-transparent'
                )}
              >
                <Text
                  className={cn(
                    'font-medium',
                    role === 'member' ? 'text-emerald-400' : 'text-gray-400'
                  )}
                >
                  Member
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setRole('admin')}
                className={cn(
                  'flex-1 py-3 rounded-xl items-center border',
                  role === 'admin'
                    ? 'bg-amber-500/20 border-amber-500/50'
                    : 'bg-[#1a1a2e] border-transparent'
                )}
              >
                <Text
                  className={cn(
                    'font-medium',
                    role === 'admin' ? 'text-amber-400' : 'text-gray-400'
                  )}
                >
                  Admin
                </Text>
              </Pressable>
            </View>
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <Text className="text-red-400">{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleInvite}
            disabled={!email.trim() || isSubmitting}
            className={cn(
              'py-4 rounded-xl items-center',
              email.trim() && !isSubmitting ? 'bg-emerald-500' : 'bg-gray-700'
            )}
          >
            <Text
              className={cn(
                'font-semibold',
                email.trim() && !isSubmitting ? 'text-white' : 'text-gray-500'
              )}
            >
              {isSubmitting ? 'Inviting...' : 'Send Invitation'}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function EditCrewModal({
  crew,
  onClose,
  onSave,
  onDelete,
}: {
  crew: Crew;
  onClose: () => void;
  onSave: (updates: Partial<Crew>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(crew.name);
  const [artistName, setArtistName] = useState(crew.artistName);

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Edit Crew</Text>
          <Pressable
            onPress={() => {
              onSave({
                name: name.trim(),
                artistName: artistName.trim(),
                updatedAt: new Date().toISOString(),
              });
            }}
            disabled={!name.trim() || !artistName.trim()}
            className={cn(
              'px-4 py-2 rounded-lg',
              name.trim() && artistName.trim() ? 'bg-emerald-500' : 'bg-gray-700'
            )}
          >
            <Text
              className={cn(
                'font-semibold',
                name.trim() && artistName.trim() ? 'text-white' : 'text-gray-500'
              )}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2">Crew Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="bg-[#1a1a2e] rounded-xl px-4 py-4 text-white text-base"
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2">Band / Artist Name</Text>
            <TextInput
              value={artistName}
              onChangeText={setArtistName}
              className="bg-[#1a1a2e] rounded-xl px-4 py-4 text-white text-base"
            />
          </View>

          <Pressable
            onPress={onDelete}
            className="bg-red-500/10 border border-red-500/30 rounded-xl py-4 items-center mt-8"
          >
            <View className="flex-row items-center">
              <Trash2 size={18} color="#ef4444" />
              <Text className="text-red-400 font-semibold ml-2">Delete Crew</Text>
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
