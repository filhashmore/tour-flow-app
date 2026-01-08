import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mic,
  Plus,
  X,
  Copy,
  Share2,
  Zap,
  Volume2,
  ChevronDown,
  Check,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { useTourFlowStore, type InputChannel } from '@/lib/store';
import { cn } from '@/lib/cn';

// Common microphone options for quick selection
const COMMON_MICS = [
  'SM58', 'SM57', 'Beta 58A', 'Beta 57A',
  'Beta 91A', 'Beta 52A', 'Beta 98',
  'e906', 'e609', 'e604', 'e935', 'e945',
  'MD421', 'MD441',
  'KSM32', 'KSM44', 'KSM141',
  'C414', 'AT4050', 'U87',
  'SM7B', 'RE20',
  'DI Box', 'Active DI', 'Passive DI',
];

// Common sources for drums/instruments
const COMMON_SOURCES = {
  drums: ['Kick In', 'Kick Out', 'Snare Top', 'Snare Bot', 'Hi-Hat', 'Rack Tom 1', 'Rack Tom 2', 'Floor Tom', 'OH L', 'OH R'],
  bass: ['Bass DI', 'Bass Amp'],
  guitar: ['GTR 1', 'GTR 2', 'GTR 3', 'Acoustic GTR'],
  keys: ['Keys L', 'Keys R', 'Piano L', 'Piano R'],
  vocals: ['Lead Vox', 'BGV 1', 'BGV 2', 'BGV 3', 'BGV 4'],
  other: ['Perc', 'Horns', 'Violin', 'Cello', 'Aux', 'FX'],
};

// Predefined 32-channel template
function generateDefaultInputList(): InputChannel[] {
  return Array.from({ length: 32 }, (_, i) => ({
    channel: i + 1,
    source: '',
    mic: '',
    diOrPreamp: '',
    stand: '',
    notes: '',
    phantom: false,
    pad: false,
  }));
}

export default function InputsScreen() {
  const inputList = useTourFlowStore(s => s.inputList);
  const setInputList = useTourFlowStore(s => s.setInputList);
  const updateInputChannel = useTourFlowStore(s => s.updateInputChannel);
  const canEdit = useTourFlowStore(s => s.canEdit);

  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  // Initialize with 32 channels if empty
  const channels = useMemo(() => {
    if (inputList.length === 0) {
      return generateDefaultInputList();
    }
    // Ensure we have 32 channels
    if (inputList.length < 32) {
      const existing = [...inputList];
      for (let i = inputList.length; i < 32; i++) {
        existing.push({
          channel: i + 1,
          source: '',
          mic: '',
          diOrPreamp: '',
          stand: '',
          notes: '',
          phantom: false,
          pad: false,
        });
      }
      return existing;
    }
    return inputList;
  }, [inputList]);

  // Stats
  const usedChannels = channels.filter(c => c.source.trim() !== '').length;
  const phantomCount = channels.filter(c => c.phantom).length;

  const handleChannelPress = (channel: number) => {
    setSelectedChannel(channel);
    setShowEditModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveChannel = (data: Partial<InputChannel>) => {
    if (selectedChannel === null) return;

    // Update or create the channel
    if (inputList.length === 0) {
      // Initialize all 32 channels first
      const newList = generateDefaultInputList();
      newList[selectedChannel - 1] = { ...newList[selectedChannel - 1], ...data };
      setInputList(newList);
    } else {
      updateInputChannel(selectedChannel, data);
    }

    setShowEditModal(false);
    setSelectedChannel(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const copyInputList = async () => {
    const text = channels
      .filter(c => c.source.trim() !== '')
      .map(c => {
        let line = `CH${String(c.channel).padStart(2, '0')}: ${c.source}`;
        if (c.mic) line += ` - ${c.mic}`;
        if (c.phantom) line += ' [48V]';
        if (c.notes) line += ` (${c.notes})`;
        return line;
      })
      .join('\n');

    const header = `INPUT LIST (${usedChannels} Channels)\n${'─'.repeat(40)}\n`;
    await Clipboard.setStringAsync(header + text);
    setCopiedMessage(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const shareInputList = async () => {
    const text = channels
      .filter(c => c.source.trim() !== '')
      .map(c => {
        let line = `CH${String(c.channel).padStart(2, '0')}: ${c.source}`;
        if (c.mic) line += ` - ${c.mic}`;
        if (c.phantom) line += ' [48V]';
        return line;
      })
      .join('\n');

    const header = `INPUT LIST (${usedChannels} Channels)\n\n`;
    try {
      await Share.share({
        message: header + text + '\n\nShared via Tour Flow',
        title: 'Input List',
      });
    } catch {
      // User cancelled
    }
  };

  const clearAllChannels = () => {
    setInputList(generateDefaultInputList());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const getConditionColor = (channel: InputChannel) => {
    if (!channel.source.trim()) return '#374151'; // Empty - gray
    if (channel.phantom) return '#8b5cf6'; // Purple for phantom
    return '#22c55e'; // Green for assigned
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
              <Text className="text-white text-2xl font-bold mt-1">Input List</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={copyInputList}
                className="w-10 h-10 rounded-full bg-[#1a1a2e] items-center justify-center"
              >
                {copiedMessage ? (
                  <Check size={18} color="#22c55e" />
                ) : (
                  <Copy size={18} color="#6b7280" />
                )}
              </Pressable>
              <Pressable
                onPress={shareInputList}
                className="w-10 h-10 rounded-full bg-[#1a1a2e] items-center justify-center"
              >
                <Share2 size={18} color="#6b7280" />
              </Pressable>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-3">
              <View className="flex-row items-center justify-between">
                <Mic size={16} color="#22c55e" />
                <Text className="text-white font-bold text-lg">{usedChannels}</Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1">Channels Used</Text>
            </View>
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-3">
              <View className="flex-row items-center justify-between">
                <Volume2 size={16} color="#6b7280" />
                <Text className="text-white font-bold text-lg">32</Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1">Total Channels</Text>
            </View>
            <View className="flex-1 bg-[#1a1a2e] rounded-xl p-3">
              <View className="flex-row items-center justify-between">
                <Zap size={16} color="#8b5cf6" />
                <Text className="text-white font-bold text-lg">{phantomCount}</Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1">+48V Phantom</Text>
            </View>
          </View>

          {/* View Toggle */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                setViewMode('list');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                "flex-1 py-2 rounded-lg items-center",
                viewMode === 'list' ? "bg-emerald-500/20" : "bg-[#1a1a2e]"
              )}
            >
              <Text className={cn(
                "font-medium",
                viewMode === 'list' ? "text-emerald-400" : "text-gray-500"
              )}>List View</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setViewMode('table');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                "flex-1 py-2 rounded-lg items-center",
                viewMode === 'table' ? "bg-emerald-500/20" : "bg-[#1a1a2e]"
              )}
            >
              <Text className={cn(
                "font-medium",
                viewMode === 'table' ? "text-emerald-400" : "text-gray-500"
              )}>Table View</Text>
            </Pressable>
          </View>
        </View>

        {/* Channel List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {viewMode === 'list' ? (
            // List View
            channels.map((channel, index) => (
              <Animated.View
                key={channel.channel}
                entering={FadeInDown.delay(index * 15).duration(200)}
              >
                <Pressable
                  onPress={() => handleChannelPress(channel.channel)}
                  className="mb-2"
                >
                  <View className={cn(
                    "bg-[#1a1a2e] rounded-xl p-4 flex-row items-center",
                    channel.source.trim() && "border-l-4",
                  )} style={channel.source.trim() ? { borderLeftColor: getConditionColor(channel) } : undefined}>
                    {/* Channel Number */}
                    <View className={cn(
                      "w-10 h-10 rounded-lg items-center justify-center mr-3",
                      channel.source.trim() ? "bg-emerald-500/20" : "bg-white/5"
                    )}>
                      <Text className={cn(
                        "font-bold",
                        channel.source.trim() ? "text-emerald-400" : "text-gray-600"
                      )}>
                        {String(channel.channel).padStart(2, '0')}
                      </Text>
                    </View>

                    {/* Channel Info */}
                    <View className="flex-1">
                      {channel.source.trim() ? (
                        <>
                          <Text className="text-white font-semibold">{channel.source}</Text>
                          <View className="flex-row items-center mt-1 gap-2">
                            {channel.mic && (
                              <Text className="text-gray-400 text-sm">{channel.mic}</Text>
                            )}
                            {channel.phantom && (
                              <View className="bg-purple-500/20 px-2 py-0.5 rounded-full">
                                <Text className="text-purple-400 text-xs">+48V</Text>
                              </View>
                            )}
                            {channel.pad && (
                              <View className="bg-amber-500/20 px-2 py-0.5 rounded-full">
                                <Text className="text-amber-400 text-xs">PAD</Text>
                              </View>
                            )}
                          </View>
                        </>
                      ) : (
                        <Text className="text-gray-600 italic">Tap to assign</Text>
                      )}
                    </View>

                    {/* Edit indicator */}
                    {canEdit() && (
                      <Edit3 size={14} color="#6b7280" />
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            ))
          ) : (
            // Table View
            <View className="bg-[#1a1a2e] rounded-xl overflow-hidden">
              {/* Table Header */}
              <View className="flex-row bg-[#0f0f0f] py-3 px-2">
                <Text className="text-gray-500 text-xs font-semibold w-10 text-center">CH</Text>
                <Text className="text-gray-500 text-xs font-semibold flex-1">SOURCE</Text>
                <Text className="text-gray-500 text-xs font-semibold w-24">MIC</Text>
                <Text className="text-gray-500 text-xs font-semibold w-12 text-center">48V</Text>
              </View>

              {/* Table Rows */}
              {channels.map((channel, index) => (
                <Pressable
                  key={channel.channel}
                  onPress={() => handleChannelPress(channel.channel)}
                  className={cn(
                    "flex-row py-3 px-2 items-center",
                    index < channels.length - 1 && "border-b border-white/5"
                  )}
                >
                  <Text className={cn(
                    "w-10 text-center font-bold text-sm",
                    channel.source.trim() ? "text-emerald-400" : "text-gray-600"
                  )}>
                    {String(channel.channel).padStart(2, '0')}
                  </Text>
                  <Text className={cn(
                    "flex-1 text-sm",
                    channel.source.trim() ? "text-white" : "text-gray-600"
                  )} numberOfLines={1}>
                    {channel.source || '—'}
                  </Text>
                  <Text className="text-gray-400 text-sm w-24" numberOfLines={1}>
                    {channel.mic || '—'}
                  </Text>
                  <View className="w-12 items-center">
                    {channel.phantom && (
                      <Zap size={14} color="#8b5cf6" />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>

      {/* Edit Channel Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        {selectedChannel !== null && (
          <EditChannelModal
            channel={channels.find(c => c.channel === selectedChannel) || {
              channel: selectedChannel,
              source: '',
              mic: '',
              diOrPreamp: '',
              stand: '',
              notes: '',
              phantom: false,
              pad: false,
            }}
            onClose={() => {
              setShowEditModal(false);
              setSelectedChannel(null);
            }}
            onSave={handleSaveChannel}
          />
        )}
      </Modal>
    </View>
  );
}

function EditChannelModal({
  channel,
  onClose,
  onSave,
}: {
  channel: InputChannel;
  onClose: () => void;
  onSave: (data: Partial<InputChannel>) => void;
}) {
  const [source, setSource] = useState(channel.source);
  const [mic, setMic] = useState(channel.mic);
  const [diOrPreamp, setDiOrPreamp] = useState(channel.diOrPreamp || '');
  const [stand, setStand] = useState(channel.stand);
  const [notes, setNotes] = useState(channel.notes);
  const [phantom, setPhantom] = useState(channel.phantom);
  const [pad, setPad] = useState(channel.pad);

  const handleSave = () => {
    onSave({
      source: source.trim(),
      mic: mic.trim(),
      diOrPreamp: diOrPreamp.trim(),
      stand: stand.trim(),
      notes: notes.trim(),
      phantom,
      pad,
    });
  };

  const handleClear = () => {
    onSave({
      source: '',
      mic: '',
      diOrPreamp: '',
      stand: '',
      notes: '',
      phantom: false,
      pad: false,
    });
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">
            Channel {String(channel.channel).padStart(2, '0')}
          </Text>
          <Pressable onPress={handleSave}>
            <Text className="text-emerald-400 font-semibold">Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Source */}
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Source / Instrument</Text>
            <TextInput
              value={source}
              onChangeText={setSource}
              placeholder="e.g., Kick In, Lead Vox, GTR 1"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
            {/* Quick source suggestions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
              <View className="flex-row gap-2">
                {[...COMMON_SOURCES.drums.slice(0, 4), ...COMMON_SOURCES.vocals.slice(0, 2)].map(s => (
                  <Pressable
                    key={s}
                    onPress={() => {
                      setSource(s);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="bg-white/5 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-gray-400 text-sm">{s}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Microphone */}
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Microphone / DI</Text>
            <TextInput
              value={mic}
              onChangeText={setMic}
              placeholder="e.g., SM58, Beta 91A, DI Box"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
            {/* Quick mic suggestions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
              <View className="flex-row gap-2">
                {COMMON_MICS.slice(0, 10).map(m => (
                  <Pressable
                    key={m}
                    onPress={() => {
                      setMic(m);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="bg-white/5 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-gray-400 text-sm">{m}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* DI/Preamp */}
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">DI / Preamp (Optional)</Text>
            <TextInput
              value={diOrPreamp}
              onChangeText={setDiOrPreamp}
              placeholder="e.g., Radial J48, Neve 1073"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          {/* Stand */}
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Stand Type</Text>
            <TextInput
              value={stand}
              onChangeText={setStand}
              placeholder="e.g., Short boom, Tall, Clip"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          {/* Phantom & Pad Toggles */}
          <View className="flex-row gap-3 mb-5">
            <Pressable
              onPress={() => {
                setPhantom(!phantom);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                "flex-1 flex-row items-center justify-between p-4 rounded-xl",
                phantom ? "bg-purple-500/20 border border-purple-500/30" : "bg-[#1a1a2e]"
              )}
            >
              <View className="flex-row items-center">
                <Zap size={18} color={phantom ? "#8b5cf6" : "#6b7280"} />
                <Text className={cn(
                  "ml-2",
                  phantom ? "text-purple-400 font-medium" : "text-gray-400"
                )}>+48V Phantom</Text>
              </View>
              <View className={cn(
                "w-5 h-5 rounded-full items-center justify-center",
                phantom ? "bg-purple-500" : "bg-white/10"
              )}>
                {phantom && <Check size={12} color="#fff" />}
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setPad(!pad);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                "flex-1 flex-row items-center justify-between p-4 rounded-xl",
                pad ? "bg-amber-500/20 border border-amber-500/30" : "bg-[#1a1a2e]"
              )}
            >
              <View className="flex-row items-center">
                <Volume2 size={18} color={pad ? "#f59e0b" : "#6b7280"} />
                <Text className={cn(
                  "ml-2",
                  pad ? "text-amber-400 font-medium" : "text-gray-400"
                )}>PAD</Text>
              </View>
              <View className={cn(
                "w-5 h-5 rounded-full items-center justify-center",
                pad ? "bg-amber-500" : "bg-white/10"
              )}>
                {pad && <Check size={12} color="#fff" />}
              </View>
            </Pressable>
          </View>

          {/* Notes */}
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., Phase flip, Gate, -10dB"
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[60px]"
            />
          </View>

          {/* Clear Channel */}
          {source.trim() && (
            <Pressable
              onPress={handleClear}
              className="bg-red-500/10 border border-red-500/30 rounded-xl py-3 items-center mb-5"
            >
              <View className="flex-row items-center">
                <Trash2 size={16} color="#ef4444" />
                <Text className="text-red-400 font-medium ml-2">Clear Channel</Text>
              </View>
            </Pressable>
          )}

          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
