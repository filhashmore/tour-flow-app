import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText,
  Plus,
  Search,
  X,
  File,
  ListMusic,
  LayoutGrid,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  ChevronRight,
  Download,
  Share2,
  Copy,
  Edit3,
  Trash2
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTourFlowStore, type Document, type InputChannel } from '@/lib/store';
import { cn } from '@/lib/cn';

const DOC_TYPES = [
  { id: 'all', label: 'All', icon: FileText },
  { id: 'rider', label: 'Riders', icon: File },
  { id: 'input_list', label: 'Input Lists', icon: ListMusic },
  { id: 'stage_plot', label: 'Stage Plots', icon: LayoutGrid },
  { id: 'day_sheet', label: 'Day Sheets', icon: Calendar },
  { id: 'settlement', label: 'Settlements', icon: DollarSign },
];

export default function DocumentsScreen() {
  const documents = useTourFlowStore(s => s.documents);
  const inputList = useTourFlowStore(s => s.inputList);
  const addDocument = useTourFlowStore(s => s.addDocument);
  const deleteDocument = useTourFlowStore(s => s.deleteDocument);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showInputList, setShowInputList] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'rider': return File;
      case 'input_list': return ListMusic;
      case 'stage_plot': return LayoutGrid;
      case 'day_sheet': return Calendar;
      case 'settlement': return DollarSign;
      case 'advance': return FileSpreadsheet;
      default: return FileText;
    }
  };

  const getDocColor = (type: string) => {
    switch (type) {
      case 'rider': return '#8b5cf6';
      case 'input_list': return '#00d4aa';
      case 'stage_plot': return '#3b82f6';
      case 'day_sheet': return '#f59e0b';
      case 'settlement': return '#ef4444';
      case 'advance': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
              <Text className="text-white text-2xl font-bold mt-1">Documents</Text>
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
              placeholder="Search documents..."
              placeholderTextColor="#6b7280"
              className="flex-1 text-white ml-3 text-base"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color="#6b7280" />
              </Pressable>
            )}
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-4">
            <Pressable
              onPress={() => {
                setShowInputList(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3"
            >
              <ListMusic size={20} color="#00d4aa" />
              <Text className="text-emerald-400 font-medium mt-2">Input List</Text>
              <Text className="text-gray-500 text-xs mt-0.5">{inputList.length} channels</Text>
            </Pressable>
            <Pressable
              className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3"
            >
              <LayoutGrid size={20} color="#3b82f6" />
              <Text className="text-blue-400 font-medium mt-2">Stage Plot</Text>
              <Text className="text-gray-500 text-xs mt-0.5">Visual editor</Text>
            </Pressable>
          </View>

          {/* Type Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
          >
            <View className="flex-row gap-2">
              {DOC_TYPES.map(type => (
                <Pressable
                  key={type.id}
                  onPress={() => {
                    setSelectedType(type.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full flex-row items-center",
                    selectedType === type.id ? "bg-emerald-500" : "bg-[#1a1a2e]"
                  )}
                >
                  <type.icon size={14} color={selectedType === type.id ? "#fff" : "#6b7280"} />
                  <Text className={cn(
                    "text-sm font-medium ml-2",
                    selectedType === type.id ? "text-white" : "text-gray-400"
                  )}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Documents List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {filteredDocs.length === 0 ? (
            <View className="items-center justify-center py-12">
              <FileText size={48} color="#374151" />
              <Text className="text-gray-500 mt-4 text-center">
                {searchQuery ? 'No documents match your search' : 'No documents yet'}
              </Text>
            </View>
          ) : (
            filteredDocs.map((doc, index) => {
              const DocIcon = getDocIcon(doc.type);
              const docColor = getDocColor(doc.type);

              return (
                <Animated.View
                  key={doc.id}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedDoc(selectedDoc?.id === doc.id ? null : doc);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="mb-3"
                  >
                    <View className={cn(
                      "bg-[#1a1a2e] rounded-xl overflow-hidden",
                      selectedDoc?.id === doc.id && "border border-emerald-500/30"
                    )}>
                      <View className="p-4">
                        <View className="flex-row items-start">
                          <View
                            className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                            style={{ backgroundColor: `${docColor}20` }}
                          >
                            <DocIcon size={20} color={docColor} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-white font-bold">{doc.name}</Text>
                            <View className="flex-row items-center mt-1">
                              <Text
                                className="text-xs uppercase"
                                style={{ color: docColor }}
                              >
                                {doc.type.replace('_', ' ')}
                              </Text>
                              <Text className="text-gray-600 mx-2">•</Text>
                              <Text className="text-gray-500 text-xs">
                                Updated {formatDate(doc.updatedAt)}
                              </Text>
                            </View>
                          </View>
                          <ChevronRight size={18} color="#6b7280" />
                        </View>
                      </View>

                      {/* Expanded Content */}
                      {selectedDoc?.id === doc.id && (
                        <Animated.View
                          entering={FadeIn.duration(200)}
                          className="px-4 pb-4 pt-2 border-t border-white/10"
                        >
                          <View className="bg-white/5 rounded-lg p-3 mb-3">
                            <Text className="text-gray-400 text-sm" numberOfLines={10}>
                              {doc.content}
                            </Text>
                          </View>

                          <View className="flex-row gap-2">
                            <Pressable className="flex-1 bg-white/5 py-2 rounded-lg flex-row items-center justify-center">
                              <Edit3 size={14} color="#6b7280" />
                              <Text className="text-gray-400 text-sm ml-2">Edit</Text>
                            </Pressable>
                            <Pressable className="flex-1 bg-white/5 py-2 rounded-lg flex-row items-center justify-center">
                              <Copy size={14} color="#6b7280" />
                              <Text className="text-gray-400 text-sm ml-2">Duplicate</Text>
                            </Pressable>
                            <Pressable className="flex-1 bg-white/5 py-2 rounded-lg flex-row items-center justify-center">
                              <Share2 size={14} color="#6b7280" />
                              <Text className="text-gray-400 text-sm ml-2">Share</Text>
                            </Pressable>
                          </View>
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

      {/* Input List Modal */}
      <Modal
        visible={showInputList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInputList(false)}
      >
        <InputListView
          inputList={inputList}
          onClose={() => setShowInputList(false)}
        />
      </Modal>

      {/* Add Document Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddDocumentModal
          onClose={() => setShowAddModal(false)}
          onAdd={(doc) => {
            addDocument(doc);
            setShowAddModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      </Modal>
    </View>
  );
}

function InputListView({ inputList, onClose }: { inputList: InputChannel[]; onClose: () => void }) {
  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Input List</Text>
          <Pressable>
            <Share2 size={20} color="#00d4aa" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header Row */}
          <View className="flex-row bg-[#1a1a2e] px-4 py-3 border-b border-white/10">
            <Text className="text-gray-500 text-xs font-semibold w-10">CH</Text>
            <Text className="text-gray-500 text-xs font-semibold flex-1">SOURCE</Text>
            <Text className="text-gray-500 text-xs font-semibold w-24">MIC/DI</Text>
            <Text className="text-gray-500 text-xs font-semibold w-16">STAND</Text>
          </View>

          {inputList.map((channel, index) => (
            <Animated.View
              key={channel.channel}
              entering={FadeInDown.delay(index * 20).duration(200)}
            >
              <View className={cn(
                "flex-row items-center px-4 py-3",
                index % 2 === 0 ? "bg-[#0f0f15]" : "bg-[#0a0a0f]"
              )}>
                <View className="w-10">
                  <View className="bg-emerald-500/20 w-7 h-7 rounded items-center justify-center">
                    <Text className="text-emerald-400 text-xs font-bold">{channel.channel}</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">{channel.source}</Text>
                  {channel.notes && (
                    <Text className="text-gray-500 text-xs">{channel.notes}</Text>
                  )}
                </View>
                <View className="w-24">
                  <Text className="text-gray-300 text-sm">{channel.mic}</Text>
                  {channel.diOrPreamp && (
                    <Text className="text-gray-500 text-xs">{channel.diOrPreamp}</Text>
                  )}
                </View>
                <View className="w-16 flex-row items-center gap-1">
                  <Text className="text-gray-400 text-xs">{channel.stand.substring(0, 8)}</Text>
                </View>
              </View>
            </Animated.View>
          ))}

          <View className="p-4 border-t border-white/10 mt-4">
            <Text className="text-gray-500 text-xs font-semibold uppercase mb-2">Legend</Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
                <Text className="text-gray-400 text-xs">48V Required</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <Text className="text-gray-400 text-xs">Phase Flip</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <Text className="text-gray-400 text-xs">Pad</Text>
              </View>
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AddDocumentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (doc: Document) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Document['type']>('rider');
  const [content, setContent] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;

    const doc: Document = {
      id: `doc-${Date.now()}`,
      name: name.trim(),
      type,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAdd(doc);
  };

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">New Document</Text>
          <Pressable onPress={handleAdd} disabled={!name.trim()}>
            <Text className={cn(
              "text-base font-semibold",
              name.trim() ? "text-emerald-400" : "text-gray-600"
            )}>Create</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Document Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Technical Rider v2"
              placeholderTextColor="#4b5563"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base"
            />
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {DOC_TYPES.filter(t => t.id !== 'all').map(docType => (
                  <Pressable
                    key={docType.id}
                    onPress={() => setType(docType.id as Document['type'])}
                    className={cn(
                      "px-4 py-2 rounded-full flex-row items-center",
                      type === docType.id ? "bg-emerald-500" : "bg-[#1a1a2e]"
                    )}
                  >
                    <docType.icon size={14} color={type === docType.id ? "#fff" : "#6b7280"} />
                    <Text className={cn(
                      "text-sm ml-2",
                      type === docType.id ? "text-white font-medium" : "text-gray-400"
                    )}>
                      {docType.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="mb-5">
            <Text className="text-gray-400 text-sm mb-2">Content</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Paste or type document content..."
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[200px]"
            />
          </View>

          <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-5">
            <Text className="text-emerald-400 font-medium mb-1">Pro Tip</Text>
            <Text className="text-gray-400 text-sm">
              Use the AI Assistant to parse and generate documents from your existing files. Just paste your content and ask for formatting help.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
