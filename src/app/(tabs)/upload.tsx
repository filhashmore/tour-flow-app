import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Upload,
  FileText,
  ListMusic,
  Package,
  Mic,
  ClipboardPaste,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Zap,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useTourFlowStore, type InputChannel, type GearItem, type CrewDocument } from '@/lib/store';
import { cn } from '@/lib/cn';

type UploadCategory = 'rider' | 'input_list' | 'gear_list' | 'stage_plot' | 'other';

const CATEGORIES: { id: UploadCategory; label: string; icon: React.ComponentType<{ size: number; color: string }>; description: string; color: string }[] = [
  { id: 'rider', label: 'Technical Rider', icon: FileText, description: 'Parse technical requirements, backline, hospitality', color: '#8b5cf6' },
  { id: 'input_list', label: 'Input List', icon: ListMusic, description: 'Parse channel assignments, mic choices, routing', color: '#3b82f6' },
  { id: 'gear_list', label: 'Gear List', icon: Package, description: 'Parse equipment inventory, conditions, pack numbers', color: '#22c55e' },
  { id: 'stage_plot', label: 'Stage Plot', icon: Mic, description: 'Parse stage layout, positions, monitor locations', color: '#f59e0b' },
  { id: 'other', label: 'Other Document', icon: FileText, description: 'General document for reference', color: '#6b7280' },
];

export default function UploadScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<UploadCategory | null>(null);
  const [pastedContent, setPastedContent] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);

  const handleCategorySelect = (category: UploadCategory) => {
    setSelectedCategory(category);
    setShowPasteModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setPastedContent(text);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      console.error('Failed to paste');
    }
  };

  const handleProcess = async () => {
    if (!pastedContent.trim() || !selectedCategory) return;

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Parse the content based on category
    const parsed = parseContent(pastedContent, selectedCategory);
    setParsedData(parsed);

    setIsProcessing(false);
    setShowPasteModal(false);
    setShowResultsModal(true);
  };

  const handleSaveData = () => {
    if (!parsedData) return;

    // Save to store based on category
    if (parsedData.type === 'input_list' && parsedData.channels) {
      saveInputList(parsedData.channels);
    } else if (parsedData.type === 'gear_list' && parsedData.items) {
      saveGearList(parsedData.items);
    }

    setShowResultsModal(false);
    setParsedData(null);
    setPastedContent('');
    setSelectedCategory(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate to appropriate screen
    if (parsedData.type === 'input_list') {
      router.push('/inputs');
    } else if (parsedData.type === 'gear_list') {
      router.push('/gear');
    }
  };

  // Store actions
  const setInputList = useTourFlowStore(s => s.setInputList);
  const addGear = useTourFlowStore(s => s.addGear);
  const gear = useTourFlowStore(s => s.gear);

  const saveInputList = (channels: InputChannel[]) => {
    setInputList(channels);
  };

  const saveGearList = (items: GearItem[]) => {
    items.forEach(item => addGear(item));
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
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-gray-500 text-sm font-medium tracking-wider uppercase">Tour Flow</Text>
              <Text className="text-white text-2xl font-bold mt-1">Upload Data</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-emerald-500/20 items-center justify-center">
              <Upload size={24} color="#22c55e" />
            </View>
          </View>
          <Text className="text-gray-400 text-sm">
            Paste document content to automatically parse and import into Tour Flow
          </Text>
        </View>

        {/* Category Selection */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Select Document Type
          </Text>

          {CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            return (
              <Animated.View
                key={category.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
              >
                <Pressable
                  onPress={() => handleCategorySelect(category.id)}
                  className="mb-3"
                >
                  <View className="bg-[#1a1a2e] rounded-xl p-4 flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon size={24} color={category.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base">{category.label}</Text>
                      <Text className="text-gray-500 text-sm mt-0.5">{category.description}</Text>
                    </View>
                    <ChevronRight size={20} color="#6b7280" />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          {/* Help Section */}
          <View className="bg-[#1a1a2e] rounded-xl p-4 mt-4 mb-8">
            <View className="flex-row items-center mb-3">
              <Zap size={18} color="#22c55e" />
              <Text className="text-white font-medium ml-2">How It Works</Text>
            </View>
            <Text className="text-gray-400 text-sm mb-2">
              1. Select the type of document you want to import
            </Text>
            <Text className="text-gray-400 text-sm mb-2">
              2. Paste the content from your document (PDF text, spreadsheet, etc.)
            </Text>
            <Text className="text-gray-400 text-sm mb-2">
              3. Review the parsed data and make any corrections
            </Text>
            <Text className="text-gray-400 text-sm">
              4. Save to your Tour Flow data
            </Text>
          </View>

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>

      {/* Paste Content Modal */}
      <Modal
        visible={showPasteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowPasteModal(false);
          setPastedContent('');
        }}
      >
        <View className="flex-1 bg-[#0a0a0f]">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
              <Pressable onPress={() => {
                setShowPasteModal(false);
                setPastedContent('');
              }}>
                <X size={24} color="#6b7280" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">
                {CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Upload'}
              </Text>
              <Pressable
                onPress={handleProcess}
                disabled={!pastedContent.trim() || isProcessing}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  pastedContent.trim() && !isProcessing ? "bg-emerald-500" : "bg-gray-700"
                )}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className={cn(
                    "font-semibold",
                    pastedContent.trim() ? "text-white" : "text-gray-500"
                  )}>Parse</Text>
                )}
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-4">
              {/* Quick Paste Button */}
              <Pressable
                onPress={handlePasteFromClipboard}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4 flex-row items-center justify-center"
              >
                <ClipboardPaste size={20} color="#22c55e" />
                <Text className="text-emerald-400 font-medium ml-2">Paste from Clipboard</Text>
              </Pressable>

              {/* Content Input */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Paste Document Content</Text>
                <TextInput
                  value={pastedContent}
                  onChangeText={setPastedContent}
                  placeholder={getPlaceholderForCategory(selectedCategory)}
                  placeholderTextColor="#4b5563"
                  multiline
                  textAlignVertical="top"
                  className="bg-[#1a1a2e] text-white px-4 py-3 rounded-xl text-base min-h-[300px]"
                />
              </View>

              {/* Format Tips */}
              <View className="bg-[#1a1a2e] rounded-xl p-4 mb-8">
                <Text className="text-gray-400 font-medium mb-2">Accepted Formats</Text>
                {getFormatTips(selectedCategory).map((tip, i) => (
                  <Text key={i} className="text-gray-500 text-sm mb-1">• {tip}</Text>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View className="flex-1 bg-[#0a0a0f]">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
              <Pressable onPress={() => setShowResultsModal(false)}>
                <X size={24} color="#6b7280" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Review & Save</Text>
              <Pressable
                onPress={handleSaveData}
                className="bg-emerald-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Save</Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-4">
              {parsedData && (
                <ParsedDataView data={parsedData} />
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

// Types for parsed data
interface ParsedData {
  type: UploadCategory;
  channels?: InputChannel[];
  items?: GearItem[];
  sections?: { title: string; content: string }[];
  raw?: string;
}

// Parse content based on category
function parseContent(content: string, category: UploadCategory): ParsedData {
  switch (category) {
    case 'input_list':
      return parseInputList(content);
    case 'gear_list':
      return parseGearList(content);
    case 'rider':
      return parseRider(content);
    default:
      return { type: category, raw: content };
  }
}

// Parse input list from text
function parseInputList(content: string): ParsedData {
  const lines = content.split('\n').filter(line => line.trim());
  const channels: InputChannel[] = [];

  // Pattern matching for common input list formats
  // Matches: "1. Kick In - Beta 91A" or "CH01: Kick - SM57" or "1 Kick Beta52"
  const channelPattern = /^(?:CH?)?(\d+)[.:\s-]+([^-–]+?)(?:[-–]\s*(.+?))?(?:\s*\[(.+?)\])?$/i;

  lines.forEach((line) => {
    const match = line.trim().match(channelPattern);
    if (match) {
      const channelNum = parseInt(match[1], 10);
      if (channelNum >= 1 && channelNum <= 32) {
        const source = match[2]?.trim() || '';
        const mic = match[3]?.trim() || '';
        const notes = match[4]?.trim() || '';
        const hasPhantom = /48v|phantom|\+48/i.test(line);

        channels.push({
          channel: channelNum,
          source,
          mic,
          diOrPreamp: '',
          stand: '',
          notes,
          phantom: hasPhantom,
          pad: /pad|-10db|-20db/i.test(line),
        });
      }
    }
  });

  // Fill empty channels up to 32
  for (let i = 1; i <= 32; i++) {
    if (!channels.find(c => c.channel === i)) {
      channels.push({
        channel: i,
        source: '',
        mic: '',
        diOrPreamp: '',
        stand: '',
        notes: '',
        phantom: false,
        pad: false,
      });
    }
  }

  // Sort by channel number
  channels.sort((a, b) => a.channel - b.channel);

  return { type: 'input_list', channels };
}

// Parse gear list from text
function parseGearList(content: string): ParsedData {
  const lines = content.split('\n').filter(line => line.trim());
  const items: GearItem[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;

    // Try to extract item details
    // Patterns: "SM58 x4" or "Beta 91A - Excellent" or "1. Console: Midas M32"
    const itemMatch = trimmed.match(/^(?:\d+[.)\s]*)?(.+?)(?:\s*[-:]\s*(.+))?$/);
    if (itemMatch) {
      const namePart = itemMatch[1]?.trim();
      const detailPart = itemMatch[2]?.trim() || '';

      // Check for quantity
      const qtyMatch = namePart.match(/(.+?)\s*[xX×]\s*(\d+)$/);
      const name = qtyMatch ? qtyMatch[1].trim() : namePart;
      const qty = qtyMatch ? parseInt(qtyMatch[2], 10) : 1;

      // Determine condition from text
      let condition: GearItem['condition'] = 'good';
      if (/excellent|new|perfect/i.test(detailPart)) condition = 'excellent';
      else if (/fair|worn|used/i.test(detailPart)) condition = 'fair';
      else if (/repair|broken|issue|problem/i.test(detailPart)) condition = 'needs_repair';

      // Determine category
      let category: GearItem['category'] = 'misc';
      if (/mic|sm\d|beta|e\d{3}|md\d{3}|ksm/i.test(name)) category = 'mics';
      else if (/di|direct|preamp|neve|api/i.test(name)) category = 'di';
      else if (/iem|in.ear|psm|shure.*ear/i.test(name)) category = 'iem';
      else if (/cable|xlr|trs|cat|snake/i.test(name)) category = 'cables';
      else if (/rf|wireless|ulxd|axient|sennheiser.*sk/i.test(name)) category = 'rf';
      else if (/case|rack|road|pelican/i.test(name)) category = 'cases';
      else if (/console|mixer|board|m32|cl5|sd/i.test(name)) category = 'console';
      else if (/guitar|bass|keys|keyboard|drum|amp/i.test(name)) category = 'backline';

      // Create items (multiple if qty > 1)
      for (let q = 0; q < qty; q++) {
        items.push({
          id: `gear-${Date.now()}-${index}-${q}`,
          name: qty > 1 ? `${name} #${q + 1}` : name,
          category,
          packNumber: '',
          height: 0,
          width: 0,
          length: 0,
          weight: 0,
          location: '',
          condition,
          notes: detailPart,
          flyPack: false,
        });
      }
    }
  });

  return { type: 'gear_list', items };
}

// Parse rider sections
function parseRider(content: string): ParsedData {
  const sections: { title: string; content: string }[] = [];

  // Split by common section headers
  const sectionHeaders = [
    'AUDIO', 'SOUND', 'PA', 'FOH', 'MONITORS',
    'BACKLINE', 'STAGE', 'LIGHTING', 'VIDEO',
    'POWER', 'HOSPITALITY', 'CATERING', 'DRESSING',
    'SECURITY', 'PARKING', 'LOAD IN', 'SCHEDULE'
  ];

  let currentSection = 'General';
  let currentContent: string[] = [];

  content.split('\n').forEach(line => {
    const trimmed = line.trim().toUpperCase();
    const matchedHeader = sectionHeaders.find(h => trimmed.includes(h));

    if (matchedHeader && trimmed.length < 50) {
      // Save previous section
      if (currentContent.length > 0) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n').trim(),
        });
      }
      currentSection = matchedHeader;
      currentContent = [];
    } else if (line.trim()) {
      currentContent.push(line);
    }
  });

  // Save last section
  if (currentContent.length > 0) {
    sections.push({
      title: currentSection,
      content: currentContent.join('\n').trim(),
    });
  }

  return { type: 'rider', sections };
}

// Component to display parsed data
function ParsedDataView({ data }: { data: ParsedData }) {
  if (data.type === 'input_list' && data.channels) {
    const usedChannels = data.channels.filter(c => c.source.trim());
    return (
      <View>
        <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4 flex-row items-center">
          <Check size={20} color="#22c55e" />
          <Text className="text-emerald-400 font-medium ml-2">
            Found {usedChannels.length} channel{usedChannels.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {usedChannels.map(channel => (
          <View key={channel.channel} className="bg-[#1a1a2e] rounded-xl p-4 mb-2 flex-row items-center">
            <View className="w-10 h-10 rounded-lg bg-emerald-500/20 items-center justify-center mr-3">
              <Text className="text-emerald-400 font-bold">
                {String(channel.channel).padStart(2, '0')}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium">{channel.source}</Text>
              {channel.mic && (
                <Text className="text-gray-400 text-sm">{channel.mic}</Text>
              )}
            </View>
            {channel.phantom && (
              <View className="bg-purple-500/20 px-2 py-1 rounded-full">
                <Text className="text-purple-400 text-xs">+48V</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  }

  if (data.type === 'gear_list' && data.items) {
    return (
      <View>
        <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4 flex-row items-center">
          <Check size={20} color="#22c55e" />
          <Text className="text-emerald-400 font-medium ml-2">
            Found {data.items.length} item{data.items.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {data.items.map(item => (
          <View key={item.id} className="bg-[#1a1a2e] rounded-xl p-4 mb-2 flex-row items-center">
            <View className="w-10 h-10 rounded-lg bg-blue-500/20 items-center justify-center mr-3">
              <Package size={18} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium">{item.name}</Text>
              <Text className="text-gray-400 text-sm capitalize">{item.category}</Text>
            </View>
            <View className={cn(
              "px-2 py-1 rounded-full",
              item.condition === 'excellent' && "bg-emerald-500/20",
              item.condition === 'good' && "bg-blue-500/20",
              item.condition === 'fair' && "bg-amber-500/20",
              item.condition === 'needs_repair' && "bg-red-500/20",
            )}>
              <Text className={cn(
                "text-xs capitalize",
                item.condition === 'excellent' && "text-emerald-400",
                item.condition === 'good' && "text-blue-400",
                item.condition === 'fair' && "text-amber-400",
                item.condition === 'needs_repair' && "text-red-400",
              )}>
                {item.condition.replace('_', ' ')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (data.type === 'rider' && data.sections) {
    return (
      <View>
        <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4 flex-row items-center">
          <FileText size={20} color="#8b5cf6" />
          <Text className="text-purple-400 font-medium ml-2">
            Parsed {data.sections.length} section{data.sections.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {data.sections.map((section, i) => (
          <View key={i} className="bg-[#1a1a2e] rounded-xl p-4 mb-2">
            <Text className="text-white font-semibold mb-2">{section.title}</Text>
            <Text className="text-gray-400 text-sm" numberOfLines={5}>
              {section.content}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex-row items-center">
      <AlertCircle size={20} color="#f59e0b" />
      <Text className="text-amber-400 ml-2">Document saved for reference</Text>
    </View>
  );
}

function getPlaceholderForCategory(category: UploadCategory | null): string {
  switch (category) {
    case 'input_list':
      return '1. Kick In - Beta 91A\n2. Kick Out - Beta 52\n3. Snare Top - SM57\n4. Snare Bottom - SM57 [Phase flip]\n5. Hi-Hat - SM81\n...';
    case 'gear_list':
      return 'SM58 x4\nBeta 91A - Excellent\nMidas M32 Console\nShure PSM1000 IEM x6\nXLR Cables 25ft x20\n...';
    case 'rider':
      return 'AUDIO REQUIREMENTS\n\nFOH:\n- Digital console with 48+ inputs\n- Full range PA system\n\nMONITORS:\n- 6 stereo IEM mixes\n- Drum fill required\n...';
    default:
      return 'Paste your document content here...';
  }
}

function getFormatTips(category: UploadCategory | null): string[] {
  switch (category) {
    case 'input_list':
      return [
        'Numbered lists: "1. Kick In - Beta 91A"',
        'Channel format: "CH01: Kick - SM57"',
        'Simple format: "1 Kick Beta52"',
        'Add [48V] or [Phantom] for phantom power',
      ];
    case 'gear_list':
      return [
        'Item names with quantities: "SM58 x4"',
        'Item with condition: "Beta 91A - Excellent"',
        'Simple list of items, one per line',
        'Categories are auto-detected from item names',
      ];
    case 'rider':
      return [
        'Section headers like AUDIO, MONITORS, BACKLINE',
        'Copy-paste from PDF technical riders',
        'Include all requirements and specifications',
        'Sections are automatically separated',
      ];
    default:
      return [
        'Plain text content',
        'PDF text exports',
        'Spreadsheet copies',
      ];
  }
}
