import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Package,
  Search,
  Plus,
  Filter,
  X,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Plane,
  Truck,
  QrCode,
  Wrench,
  Edit3
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTourFlowStore, type GearItem } from '@/lib/store';
import { cn } from '@/lib/cn';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'console', label: 'Console' },
  { id: 'mics', label: 'Mics' },
  { id: 'di', label: 'DI' },
  { id: 'iem', label: 'IEM' },
  { id: 'rf', label: 'RF' },
  { id: 'cables', label: 'Cables' },
  { id: 'cases', label: 'Cases' },
  { id: 'backline', label: 'Backline' },
  { id: 'instruments', label: 'Instruments' },
  { id: 'misc', label: 'Misc' },
];

export default function GearScreen() {
  const gear = useTourFlowStore(s => s.gear);
  const addGear = useTourFlowStore(s => s.addGear);
  const updateGear = useTourFlowStore(s => s.updateGear);
  const deleteGear = useTourFlowStore(s => s.deleteGear);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFlyPackOnly, setShowFlyPackOnly] = useState(false);
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GearItem | null>(null);

  const filteredGear = useMemo(() => {
    return gear.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.packNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesFlyPack = !showFlyPackOnly || item.flyPack;
      const matchesNeedsAttention = !showNeedsAttention || item.condition === 'needs_repair' || item.condition === 'fair';
      return matchesSearch && matchesCategory && matchesFlyPack && matchesNeedsAttention;
    });
  }, [gear, searchQuery, selectedCategory, showFlyPackOnly, showNeedsAttention]);

  const gearStats = useMemo(() => {
    const total = gear.length;
    const flyPack = gear.filter(g => g.flyPack).length;
    const needsRepair = gear.filter(g => g.condition === 'needs_repair' || g.condition === 'fair').length;
    const totalWeight = gear.reduce((acc, g) => acc + g.weight, 0);
    const flyPackWeight = gear.filter(g => g.flyPack).reduce((acc, g) => acc + g.weight, 0);
    return { total, flyPack, needsRepair, totalWeight, flyPackWeight };
  }, [gear]);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return '#00d4aa';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'needs_repair': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConditionIcon = (condition: string) => {
    if (condition === 'excellent' || condition === 'good') {
      return <CheckCircle size={14} color={getConditionColor(condition)} />;
    }
    return <AlertTriangle size={14} color={getConditionColor(condition)} />;
  };

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
              <Text className="text-white text-2xl font-bold mt-1">Gear Inventory</Text>
            </View>
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="w-10 h-10 rounded-full bg-emerald-500 items-center justify-center"
            >
              <Plus size={20} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-[#1a1a2e] rounded-xl px-4 py-3 mb-4">
            <Search size={18} color="#6b7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search gear..."
              placeholderTextColor="#6b7280"
              className="flex-1 text-white ml-3 text-base"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color="#6b7280" />
              </Pressable>
            )}
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-3">
              <View className="flex-row items-center justify-between">
                <Package size={16} color="#8b5cf6" />
                <Text className="text-white font-bold text-lg">{gearStats.total}</Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1">Total Items</Text>
            </View>
            <Pressable
              onPress={() => {
                setShowFlyPackOnly(!showFlyPackOnly);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                "flex-1 rounded-xl p-3",
                showFlyPackOnly ? "bg-blue-500/20 border border-blue-500/30" : "bg-[#1a1a2e]"
              )}
            >
              <View className="flex-row items-center justify-between">
                <Plane size={16} color="#3b82f6" />
                <Text className="text-white font-bold text-lg">{gearStats.flyPack}</Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1">Fly Pack ({gearStats.flyPackWeight.toFixed(0)} lbs)</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowNeedsAttention(!showNeedsAttention);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                "flex-1 rounded-xl p-3",
                showNeedsAttention ? "bg-amber-500/20 border border-amber-500/30" : "bg-[#1a1a2e]"
              )}
            >
              <View className="flex-row items-center justify-between">
                <Wrench size={16} color={gearStats.needsRepair > 0 ? '#f59e0b' : '#6b7280'} />
                <Text className={cn(
                  "font-bold text-lg",
                  gearStats.needsRepair > 0 ? "text-amber-400" : "text-white"
                )}>{gearStats.needsRepair}</Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1">Need Attention</Text>
            </Pressable>
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
            style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
          >
            <View className="flex-row gap-2">
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full",
                    selectedCategory === cat.id
                      ? "bg-emerald-500"
                      : "bg-[#1a1a2e]"
                  )}
                >
                  <Text className={cn(
                    "text-sm font-medium",
                    selectedCategory === cat.id ? "text-white" : "text-gray-400"
                  )}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Gear List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {filteredGear.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Package size={48} color="#374151" />
              <Text className="text-gray-500 mt-4 text-center">
                {searchQuery ? 'No gear matches your search' : 'No gear items yet'}
              </Text>
            </View>
          ) : (
            filteredGear.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 30).duration(300)}
              >
                <Pressable
                  onPress={() => {
                    setSelectedItem(selectedItem?.id === item.id ? null : item);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="mb-3"
                >
                  <View className={cn(
                    "bg-[#1a1a2e] rounded-xl overflow-hidden",
                    selectedItem?.id === item.id && "border border-emerald-500/30"
                  )}>
                    <View className="p-4">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 mb-1">
                            {getConditionIcon(item.condition)}
                            <Text className="text-gray-500 text-xs uppercase">{item.category}</Text>
                            {item.flyPack && (
                              <View className="bg-blue-500/20 px-2 py-0.5 rounded-full flex-row items-center">
                                <Plane size={10} color="#3b82f6" />
                                <Text className="text-blue-400 text-xs ml-1">Fly</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-white font-bold">{item.name}</Text>
                          <Text className="text-gray-500 text-sm">Pack: {item.packNumber}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-gray-400 text-sm">{item.weight} lbs</Text>
                          <View
                            className="mt-1 px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${getConditionColor(item.condition)}20` }}
                          >
                            <Text
                              className="text-xs capitalize"
                              style={{ color: getConditionColor(item.condition) }}
                            >
                              {item.condition.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {item.notes && (
                        <Text className="text-gray-500 text-sm mt-2">{item.notes}</Text>
                      )}
                    </View>

                    {/* Expanded Details */}
                    {selectedItem?.id === item.id && (
                      <Animated.View
                        entering={FadeIn.duration(200)}
                        className="px-4 pb-4 pt-2 border-t border-white/10"
                      >
                        <View className="flex-row flex-wrap gap-3 mb-3">
                          <View className="bg-white/5 px-3 py-2 rounded-lg">
                            <Text className="text-gray-500 text-xs mb-0.5">Dimensions (HxWxL)</Text>
                            <Text className="text-white text-sm">{item.height}" x {item.width}" x {item.length}"</Text>
                          </View>
                          <View className="bg-white/5 px-3 py-2 rounded-lg">
                            <Text className="text-gray-500 text-xs mb-0.5">Location</Text>
                            <Text className="text-white text-sm">{item.location}</Text>
                          </View>
                          {item.serialNumber && (
                            <View className="bg-white/5 px-3 py-2 rounded-lg">
                              <Text className="text-gray-500 text-xs mb-0.5">Serial #</Text>
                              <Text className="text-white text-sm">{item.serialNumber}</Text>
                            </View>
                          )}
                          {item.lastMaintenance && (
                            <View className="bg-white/5 px-3 py-2 rounded-lg">
                              <Text className="text-gray-500 text-xs mb-0.5">Last Maintenance</Text>
                              <Text className="text-white text-sm">{item.lastMaintenance}</Text>
                            </View>
                          )}
                        </View>

                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => {
                              // Toggle condition
                              const conditions: GearItem['condition'][] = ['excellent', 'good', 'fair', 'needs_repair'];
                              const currentIndex = conditions.indexOf(item.condition);
                              const nextCondition = conditions[(currentIndex + 1) % conditions.length];
                              updateGear(item.id, { condition: nextCondition });
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }}
                            className="flex-1 bg-white/5 py-2 rounded-lg flex-row items-center justify-center"
                          >
                            <Wrench size={14} color="#6b7280" />
                            <Text className="text-gray-400 text-sm ml-2">Update Status</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              updateGear(item.id, { flyPack: !item.flyPack });
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }}
                            className={cn(
                              "flex-1 py-2 rounded-lg flex-row items-center justify-center",
                              item.flyPack ? "bg-blue-500/20" : "bg-white/5"
                            )}
                          >
                            <Plane size={14} color={item.flyPack ? "#3b82f6" : "#6b7280"} />
                            <Text className={cn(
                              "text-sm ml-2",
                              item.flyPack ? "text-blue-400" : "text-gray-400"
                            )}>
                              {item.flyPack ? 'In Fly Pack' : 'Add to Fly'}
                            </Text>
                          </Pressable>
                        </View>
                      </Animated.View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>

      {/* Add Gear Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddGearModal
          onClose={() => setShowAddModal(false)}
          onAdd={(item) => {
            addGear(item);
            setShowAddModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      </Modal>
    </View>
  );
}

function AddGearModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: GearItem) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GearItem['category']>('mics');
  const [packNumber, setPackNumber] = useState('');
  const [weight, setWeight] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [flyPack, setFlyPack] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;

    const item: GearItem = {
      id: `gear-${Date.now()}`,
      name: name.trim(),
      category,
      packNumber: packNumber.trim() || 'TBD',
      height: 0,
      width: 0,
      length: 0,
      weight: parseFloat(weight) || 0,
      location: location.trim() || 'TBD',
      condition: 'good',
      notes: notes.trim(),
      flyPack,
    };

    onAdd(item);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Add Gear</Text>
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
              placeholder="e.g., Shure SM58"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat.id as GearItem['category'])}
                    className={cn(
                      "px-4 py-2 rounded-full",
                      category === cat.id ? "bg-emerald-500" : "bg-[#1a1a2e]"
                    )}
                  >
                    <Text className={cn(
                      "text-sm",
                      category === cat.id ? "text-white font-medium" : "text-gray-400"
                    )}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="flex-row gap-4 mb-5">
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">Pack #</Text>
              <TextInput
                value={packNumber}
                onChangeText={setPackNumber}
                placeholder="e.g., MIC-01"
                placeholderTextColor="#4b5563"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-sm mb-2">Weight (lbs)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="0"
                placeholderTextColor="#4b5563"
                keyboardType="numeric"
                className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Mic Case A"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any details about this item..."
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[80px]"
            />
          </View>

          <Pressable
            onPress={() => setFlyPack(!flyPack)}
            className={cn(
              "flex-row items-center justify-between p-4 rounded-xl mb-5",
              flyPack ? "bg-blue-500/20 border border-blue-500/30" : "bg-[#1a1a2e]"
            )}
          >
            <View className="flex-row items-center">
              <Plane size={20} color={flyPack ? "#3b82f6" : "#6b7280"} />
              <Text className={cn(
                "ml-3 text-base",
                flyPack ? "text-blue-400 font-medium" : "text-gray-400"
              )}>
                Include in Fly Pack
              </Text>
            </View>
            <View className={cn(
              "w-6 h-6 rounded-full items-center justify-center",
              flyPack ? "bg-blue-500" : "bg-white/10"
            )}>
              {flyPack && <CheckCircle size={16} color="#fff" />}
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
