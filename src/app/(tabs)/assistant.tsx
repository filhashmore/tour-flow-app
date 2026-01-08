import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Share as RNShare } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Send,
  Zap,
  FileText,
  ListMusic,
  Calendar,
  DollarSign,
  Volume2,
  ChevronDown,
  Radio,
  Wrench,
  MapPin,
  Upload,
  ClipboardCopy,
  AlertTriangle,
  CheckCircle,
  Share,
  Check,
  Trash2
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ExpoClipboard from 'expo-clipboard';
import { useTourFlowStore, type ChatMessage, type Show, type GearItem, type InputChannel } from '@/lib/store';
import { cn } from '@/lib/cn';

const QUICK_PROMPTS = [
  { id: 'day_sheet', label: 'Generate Day Sheet', icon: Calendar, prompt: 'Generate a day sheet for the next show. Format it as a clean, professional document ready to share with crew.' },
  { id: 'advance', label: 'Create Advance', icon: FileText, prompt: 'Generate a venue advance sheet for the next show. Include our technical requirements, input list summary, and questions to confirm with venue PM.' },
  { id: 'settlement', label: 'Settlement Sheet', icon: DollarSign, prompt: 'Create a settlement template for the next show based on available financial data.' },
  { id: 'parse_input', label: 'Parse Input List', icon: ListMusic, prompt: 'I\'m going to paste an input list. Please parse it into a clean channel list table.' },
  { id: 'parse_rider', label: 'Parse Rider', icon: FileText, prompt: 'I\'m going to paste technical rider content. Please extract and organize the requirements.' },
  { id: 'parse_gear', label: 'Parse Gear List', icon: Wrench, prompt: 'I\'m going to paste a gear list. Parse it and flag any maintenance concerns.' },
  { id: 'mixing_tips', label: 'Mixing Advice', icon: Volume2, prompt: 'Give me mixing tips for the next venue based on the PA system and room notes.' },
  { id: 'rf_coord', label: 'RF Coordination', icon: Radio, prompt: 'Help me plan RF coordination for the next show. We have PSM1000 IEMs and ULXD wireless mics.' },
  { id: 'gear_check', label: 'Pre-Tour Check', icon: Wrench, prompt: 'Create a pre-tour maintenance checklist based on my gear inventory.' },
  { id: 'routing', label: 'Optimize Routing', icon: MapPin, prompt: 'Analyze our tour routing and suggest optimizations for drive times and scheduling.' },
];

export default function AssistantScreen() {
  const chatHistory = useTourFlowStore(s => s.chatHistory);
  const addChatMessage = useTourFlowStore(s => s.addChatMessage);
  const clearChatHistory = useTourFlowStore(s => s.clearChatHistory);
  const tours = useTourFlowStore(s => s.tours);
  const gear = useTourFlowStore(s => s.gear);
  const inputList = useTourFlowStore(s => s.inputList);
  const crew = useTourFlowStore(s => s.crew);
  const documents = useTourFlowStore(s => s.documents);
  const tasks = useTourFlowStore(s => s.tasks);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (chatHistory.length > 0) {
      setShowQuickPrompts(false);
    }
  }, [chatHistory.length]);

  const buildContext = () => {
    const activeTour = tours.find(t => t.status === 'upcoming' || t.status === 'active');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcomingShows = activeTour?.shows.filter(s => new Date(s.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
    const nextShow = upcomingShows[0];
    const gearIssues = gear.filter(g => g.condition === 'needs_repair' || g.condition === 'fair');
    const pendingTasks = tasks.filter(t => t.status !== 'completed');

    let context = `You are Flow AI, an expert assistant for Tour Flow - a professional tour management app for audio engineers.

## YOUR CAPABILITIES:
1. **Document Generation**: Create professional day sheets, advance sheets, settlements, and tour documents
2. **Document Parsing**: Parse and structure input lists, riders, gear lists, and other tour documents
3. **Mixing Advice**: Provide expert live sound mixing tips, troubleshooting, and system optimization
4. **RF Coordination**: Help with wireless frequency planning and interference avoidance
5. **Tour Logistics**: Optimize routing, scheduling, and load management
6. **Gear Maintenance**: Track equipment condition and suggest maintenance schedules

## CURRENT TOUR CONTEXT:
`;

    if (activeTour) {
      context += `
**Active Tour:** ${activeTour.name}
**Artist:** ${activeTour.artist}
**Total Shows:** ${activeTour.shows.length}
**Remaining Shows:** ${upcomingShows.length}
**Tour Dates:** ${activeTour.startDate} to ${activeTour.endDate}
`;

      if (nextShow) {
        const showTasks = tasks.filter(t => t.showId === nextShow.id && t.status !== 'completed');
        context += `
### NEXT SHOW:
- **Venue:** ${nextShow.venue}
- **Location:** ${nextShow.city}, ${nextShow.state}
- **Date:** ${nextShow.date}
- **Load-in:** ${nextShow.loadIn}
- **Soundcheck:** ${nextShow.soundcheck}
- **Doors:** ${nextShow.doors}
- **Show Time:** ${nextShow.showTime}
- **Curfew:** ${nextShow.curfew}
- **Capacity:** ${nextShow.capacity?.toLocaleString() || 'TBD'}
- **Contact:** ${nextShow.venueContact} (${nextShow.venuePhone})
- **Email:** ${nextShow.venueEmail}
- **Notes:** ${nextShow.notes || 'None'}
- **Open Tasks:** ${showTasks.length}
`;
      }

      // Add all shows summary
      context += `
### ALL SHOWS:
${activeTour.shows.map((s, i) => `${i + 1}. ${s.date} - ${s.venue}, ${s.city}, ${s.state} (${s.status})`).join('\n')}
`;
    }

    if (gear.length > 0) {
      const flyPackGear = gear.filter(g => g.flyPack);
      const drivePackGear = gear.filter(g => !g.flyPack);

      context += `
### GEAR INVENTORY (${gear.length} items):
**Fly Pack:** ${flyPackGear.length} items, ${flyPackGear.reduce((acc, g) => acc + g.weight, 0).toFixed(1)} lbs total
**Drive Pack:** ${drivePackGear.length} items

**Key Equipment:**
${gear.slice(0, 8).map(g => `- ${g.name} (${g.packNumber}) - ${g.condition}${g.notes ? ': ' + g.notes : ''}`).join('\n')}

**Items Needing Attention (${gearIssues.length}):**
${gearIssues.length > 0 ? gearIssues.map(g => `- ${g.name}: ${g.notes || g.condition}`).join('\n') : 'None'}
`;
    }

    if (inputList.length > 0) {
      context += `
### INPUT LIST (${inputList.length} channels):
${inputList.map(c => `CH${c.channel}: ${c.source} - ${c.mic}${c.diOrPreamp ? ' (' + c.diOrPreamp + ')' : ''}${c.phantom ? ' [48V]' : ''}`).join('\n')}
`;
    }

    if (crew.length > 0) {
      context += `
### CREW (${crew.length}):
${crew.map(c => `- ${c.name}: ${c.role} (${c.availability}) - $${c.dayRate}/day`).join('\n')}
`;
    }

    if (pendingTasks.length > 0) {
      context += `
### PENDING TASKS (${pendingTasks.length}):
${pendingTasks.slice(0, 5).map(t => `- [${t.priority.toUpperCase()}] ${t.title}`).join('\n')}
`;
    }

    context += `

## OUTPUT FORMAT RULES:
CRITICAL: Format all output as clean, readable text. NO markdown code blocks. NO backticks. NO raw code syntax. NO logprobs or technical artifacts.

### Day Sheet Format Example:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DAY SHEET
${activeTour?.artist || '[Artist]'} • ${activeTour?.name || '[Tour]'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Date in format: Wednesday, January 15, 2026]

VENUE
[Venue Name]
[City, State]
Capacity: [number]

TIMELINE (Local Time)
Load In ........... [time] – Crew call
Soundcheck ........ [time] – Full band
Doors ............. [time]
Show .............. [time]
Curfew ............ [time]

VENUE CONTACTS
• [Name] (Production): [phone]
• [Name] (Venue PM): [phone/email]

PRODUCTION NOTES
• [Key notes from rider/show notes]
• [PA system info]
• [Any special requirements]

INPUT LIST SUMMARY
[Summarize the ${inputList.length} channel input list]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by Tour Flow

### Input List Table Format:
CH | SOURCE      | MIC/DI      | NOTES
---|-------------|-------------|-------
01 | KICK IN     | Beta 91A    | Boundary
02 | KICK OUT    | Beta 52A    |
...

### Guidelines:
- Write clean, professional documents ready to share
- Use bullet points (•) for lists
- Use dotted lines (...) for time alignments
- Use box lines (━) for document borders
- NEVER use markdown code blocks, backticks, or raw JSON
- Be concise and actionable
- Flag gear issues (${gearIssues.length} items need attention)
- Be specific about PA systems and venue details
`;

    return context;
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await ExpoClipboard.getStringAsync();
      if (text) {
        setInput(prev => prev + (prev ? '\n\n' : '') + text);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowQuickPrompts(false);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          input: [
            { role: 'system', content: buildContext() },
            ...chatHistory.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user', content: text },
          ],
        }),
      });

      const data = await response.json();

      let assistantContent = 'I apologize, but I encountered an error processing your request. Please try again.';

      if (data.output_text) {
        assistantContent = data.output_text;
      } else if (data.output && Array.isArray(data.output)) {
        const textOutput = data.output.find((o: { type: string; content?: string }) => o.type === 'message' || o.type === 'text');
        if (textOutput?.content) {
          assistantContent = typeof textOutput.content === 'string'
            ? textOutput.content
            : JSON.stringify(textOutput.content);
        }
      } else if (data.choices?.[0]?.message?.content) {
        assistantContent = data.choices[0].message.content;
      } else if (data.error) {
        assistantContent = `Error: ${data.error.message || 'Unknown error occurred'}`;
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };

      addChatMessage(assistantMessage);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered a connection error. Please check your internet connection and try again.',
        timestamp: new Date().toISOString(),
      };
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendMessage(prompt);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    await ExpoClipboard.setStringAsync(text);
    setCopiedMessageId(messageId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const shareContent = async (text: string) => {
    try {
      await RNShare.share({
        message: text,
        title: 'Tour Flow - Generated Document',
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Get context summary for display
  const activeTour = tours.find(t => t.status === 'upcoming' || t.status === 'active');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const nextShow = activeTour?.shows.find(s => new Date(s.date) >= now);
  const gearIssues = gear.filter(g => g.condition === 'needs_repair' || g.condition === 'fair');

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <LinearGradient
        colors={['#0f1419', '#0a0a0f']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between border-b border-white/5">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
              <Zap size={20} color="#00d4aa" />
            </View>
            <View>
              <Text className="text-white text-lg font-bold">Flow AI</Text>
              <Text className="text-gray-500 text-xs">Tour Assistant • GPT-5.2</Text>
            </View>
          </View>
          {chatHistory.length > 0 && (
            <Pressable
              onPress={() => {
                clearChatHistory();
                setShowQuickPrompts(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              className="px-3 py-1.5 rounded-full bg-white/5"
            >
              <Text className="text-gray-400 text-sm">Clear</Text>
            </Pressable>
          )}
        </View>

        {/* Context Banner */}
        {nextShow && chatHistory.length === 0 && (
          <View className="mx-5 mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex-row items-center">
            <Calendar size={16} color="#00d4aa" />
            <Text className="text-emerald-400 text-sm ml-2 flex-1" numberOfLines={1}>
              Next: {nextShow.venue}, {nextShow.city} • {nextShow.date}
            </Text>
            {gearIssues.length > 0 && (
              <View className="flex-row items-center bg-amber-500/20 px-2 py-1 rounded-full ml-2">
                <AlertTriangle size={12} color="#f59e0b" />
                <Text className="text-amber-400 text-xs ml-1">{gearIssues.length}</Text>
              </View>
            )}
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
          >
            {/* Welcome / Quick Prompts */}
            {showQuickPrompts && chatHistory.length === 0 && (
              <Animated.View entering={FadeIn.duration(400)}>
                <View className="items-center mb-6 mt-2">
                  <View className="w-16 h-16 rounded-full bg-emerald-500/20 items-center justify-center mb-4">
                    <Zap size={32} color="#00d4aa" />
                  </View>
                  <Text className="text-white text-xl font-bold text-center">Flow AI</Text>
                  <Text className="text-gray-500 text-center mt-2 px-4">
                    Your intelligent tour assistant for document generation, parsing, and mixing advice
                  </Text>
                </View>

                {/* Document Actions */}
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Generate Documents</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                  <View className="flex-row gap-2">
                    {QUICK_PROMPTS.slice(0, 3).map((item, index) => (
                      <Pressable
                        key={item.id}
                        onPress={() => handleQuickPrompt(item.prompt)}
                        className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex-row items-center"
                      >
                        <item.icon size={16} color="#00d4aa" />
                        <Text className="text-emerald-400 text-sm font-medium ml-2">{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Parse Actions */}
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Parse & Import</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                  <View className="flex-row gap-2">
                    {QUICK_PROMPTS.slice(3, 6).map((item, index) => (
                      <Pressable
                        key={item.id}
                        onPress={() => handleQuickPrompt(item.prompt)}
                        className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 flex-row items-center"
                      >
                        <item.icon size={16} color="#3b82f6" />
                        <Text className="text-blue-400 text-sm font-medium ml-2">{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Advice Actions */}
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Get Advice</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {QUICK_PROMPTS.slice(6).map((item, index) => (
                    <Animated.View
                      key={item.id}
                      entering={FadeInDown.delay(index * 30).duration(200)}
                    >
                      <Pressable
                        onPress={() => handleQuickPrompt(item.prompt)}
                        className="bg-[#1a1a2e] border border-white/5 rounded-xl px-4 py-3 flex-row items-center"
                      >
                        <item.icon size={16} color="#6b7280" />
                        <Text className="text-gray-300 text-sm ml-2">{item.label}</Text>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>

                {/* Tips */}
                <View className="bg-[#1a1a2e] border border-white/5 rounded-xl p-4 mt-2">
                  <Text className="text-gray-400 font-medium mb-2">Pro Tips</Text>
                  <Text className="text-gray-500 text-sm">• Paste document content directly - I'll parse and format it</Text>
                  <Text className="text-gray-500 text-sm mt-1">• Ask "day sheet for [venue name]" for specific shows</Text>
                  <Text className="text-gray-500 text-sm mt-1">• I know your gear list and will flag maintenance issues</Text>
                </View>
              </Animated.View>
            )}

            {/* Chat Messages */}
            {chatHistory.map((message, index) => (
              <Animated.View
                key={message.id}
                entering={FadeInUp.delay(50).duration(300)}
                className={cn(
                  "mb-4",
                  message.role === 'user' ? "items-end" : "items-start"
                )}
              >
                <View className={cn(
                  "max-w-[90%] rounded-2xl px-4 py-3",
                  message.role === 'user'
                    ? "bg-emerald-500 rounded-br-md"
                    : "bg-[#1a1a2e] rounded-bl-md"
                )}>
                  <Text className={cn(
                    "text-base leading-6",
                    message.role === 'user' ? "text-white" : "text-gray-200"
                  )} selectable>
                    {message.content}
                  </Text>
                </View>
                <View className="flex-row items-center mt-1 px-1">
                  <Text className="text-gray-600 text-xs">
                    {formatTime(message.timestamp)}
                  </Text>
                  {message.role === 'assistant' && (
                    <>
                      <Pressable
                        onPress={() => copyToClipboard(message.content, message.id)}
                        className="ml-2 p-1"
                      >
                        {copiedMessageId === message.id ? (
                          <Check size={12} color="#00d4aa" />
                        ) : (
                          <ClipboardCopy size={12} color="#6b7280" />
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => shareContent(message.content)}
                        className="ml-1 p-1"
                      >
                        <Share size={12} color="#6b7280" />
                      </Pressable>
                    </>
                  )}
                </View>
              </Animated.View>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <Animated.View
                entering={FadeIn.duration(200)}
                className="items-start mb-4"
              >
                <View className="bg-[#1a1a2e] rounded-2xl rounded-bl-md px-4 py-3 flex-row items-center">
                  <ActivityIndicator size="small" color="#00d4aa" />
                  <Text className="text-gray-400 ml-3">Generating...</Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View className="px-5 pb-5 pt-3 border-t border-white/5">
            <View className="flex-row items-end gap-2">
              <Pressable
                onPress={handlePasteFromClipboard}
                className="w-10 h-10 rounded-full bg-[#1a1a2e] items-center justify-center"
              >
                <ClipboardCopy size={18} color="#6b7280" />
              </Pressable>
              <View className="flex-1 bg-[#1a1a2e] rounded-2xl flex-row items-end px-4 py-2">
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask anything or paste content to parse..."
                  placeholderTextColor="#6b7280"
                  multiline
                  maxLength={4000}
                  className="flex-1 text-white text-base max-h-32 py-2"
                />
              </View>
              <Pressable
                onPress={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "w-10 h-10 rounded-full items-center justify-center",
                  input.trim() && !isLoading ? "bg-emerald-500" : "bg-[#1a1a2e]"
                )}
              >
                <Send
                  size={18}
                  color={input.trim() && !isLoading ? "#fff" : "#6b7280"}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
