import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Tour {
  id: string;
  name: string;
  artist: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  shows: Show[];
  crew: CrewMember[];
  notes: string;
  crewId?: string; // Link to Crew (optional)
}

export interface Show {
  id: string;
  tourId: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  date: string;
  loadIn: string;
  soundcheck: string;
  doors: string;
  showTime: string;
  curfew: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  venueContact: string;
  venuePhone: string;
  venueEmail: string;
  capacity: number;
  notes: string;
  settlement?: Settlement;
}

export interface Settlement {
  guarantee: number;
  bonus: number;
  merch: number;
  expenses: number;
  perDiem: number;
  total: number;
}

export interface GearItem {
  id: string;
  name: string;
  category: 'console' | 'mics' | 'di' | 'iem' | 'cables' | 'rf' | 'cases' | 'misc' | 'instruments' | 'backline';
  packNumber: string;
  height: number;
  width: number;
  length: number;
  weight: number;
  location: string;
  condition: 'excellent' | 'good' | 'fair' | 'needs_repair';
  notes: string;
  flyPack: boolean;
  serialNumber?: string;
  lastMaintenance?: string;
}

export interface InputChannel {
  channel: number;
  source: string;
  mic: string;
  diOrPreamp?: string;
  stand: string;
  notes: string;
  phantom: boolean;
  pad: boolean;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  availability: 'available' | 'unavailable' | 'tentative';
  certifications: string[];
  dayRate: number;
  notes: string;
  credentials?: string;
}

export type UserRole = 'admin' | 'user';

export interface AppSettings {
  stealthMode: boolean;
  hideFinancials: boolean;
  notificationsEnabled: boolean;
  offlineModeEnabled: boolean;
  appearance: 'dark' | 'light' | 'system';
  lastSyncDate?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'rider' | 'input_list' | 'stage_plot' | 'day_sheet' | 'advance' | 'settlement' | 'contract' | 'other';
  tourId?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parsedData?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tourId?: string;
  showId?: string;
}

// Crew types (separate from Tour crew members)
export interface Crew {
  id: string;
  name: string;
  artistName: string;
  createdAt: string;
  updatedAt: string;
  members: CrewMemberLink[];
  documents: CrewDocument[];
}

export interface CrewMemberLink {
  id: string;
  crewId: string;
  userId: string;
  role: 'admin' | 'member';
  email: string;
  name: string;
  phone?: string;
  jobTitle?: string;
  joinedAt: string;
}

export interface CrewDocument {
  id: string;
  crewId: string;
  name: string;
  type: 'rider' | 'input_list' | 'stage_plot' | 'tech_spec' | 'hospitality' | 'other';
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Store interface
interface TourFlowStore {
  // User & Auth
  currentUserId: string | null;
  currentUserRole: UserRole;
  setCurrentUserId: (userId: string | null) => void;
  setUserRole: (role: UserRole) => void;

  // App Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleStealthMode: () => void;

  // Permission helpers
  canEdit: () => boolean;
  canViewFinancials: () => boolean;

  // Tours
  tours: Tour[];
  activeTour: Tour | null;
  setActiveTour: (tour: Tour | null) => void;
  addTour: (tour: Tour) => void;
  updateTour: (id: string, tour: Partial<Tour>) => void;
  deleteTour: (id: string) => void;
  setTours: (tours: Tour[]) => void;

  // Shows
  addShow: (tourId: string, show: Show) => void;
  updateShow: (tourId: string, showId: string, show: Partial<Show>) => void;
  deleteShow: (tourId: string, showId: string) => void;

  // Gear
  gear: GearItem[];
  addGear: (item: GearItem) => void;
  updateGear: (id: string, item: Partial<GearItem>) => void;
  deleteGear: (id: string) => void;

  // Input List
  inputList: InputChannel[];
  setInputList: (list: InputChannel[]) => void;
  updateInputChannel: (channel: number, data: Partial<InputChannel>) => void;

  // Crew
  crew: CrewMember[];
  addCrewMember: (member: CrewMember) => void;
  updateCrewMember: (id: string, member: Partial<CrewMember>) => void;
  deleteCrewMember: (id: string) => void;

  // Documents
  documents: Document[];
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, doc: Partial<Document>) => void;
  deleteDocument: (id: string) => void;

  // AI Chat
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Crews (band/artist crews)
  crews: Crew[];
  activeCrew: Crew | null;
  setActiveCrew: (crew: Crew | null) => void;
  setCrews: (crews: Crew[]) => void;
  addCrew: (crew: Crew) => void;
  updateCrew: (id: string, crew: Partial<Crew>) => void;
  deleteCrew: (id: string) => void;
  addCrewMemberLink: (crewId: string, member: CrewMemberLink) => void;
  removeCrewMemberLink: (crewId: string, memberId: string) => void;
  addCrewDocument: (crewId: string, doc: CrewDocument) => void;
  updateCrewDocument: (crewId: string, docId: string, doc: Partial<CrewDocument>) => void;
  deleteCrewDocument: (crewId: string, docId: string) => void;

  // User preferences
  userProfile: {
    name: string;
    role: string;
    email: string;
    preferredConsole: string;
    preferredMics: string[];
  };
  updateUserProfile: (profile: Partial<TourFlowStore['userProfile']>) => void;

  // Data Management
  resetData: () => void;
  clearUserData: () => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useTourFlowStore = create<TourFlowStore>((set, get) => ({
  // Initial state
  currentUserId: null,
  currentUserRole: 'admin' as UserRole,
  settings: {
    stealthMode: false,
    hideFinancials: false,
    notificationsEnabled: true,
    offlineModeEnabled: true,
    appearance: 'dark' as const,
  },
  tours: [],
  activeTour: null,
  gear: [],
  inputList: [],
  crew: [],
  documents: [],
  chatHistory: [],
  tasks: [],
  crews: [],
  activeCrew: null,
  userProfile: {
    name: '',
    role: 'Audio Engineer',
    email: '',
    preferredConsole: 'Midas M32',
    preferredMics: ['Shure SM58', 'Shure Beta 91A', 'Sennheiser e906'],
  },

  // User & Auth actions
  setCurrentUserId: (userId) => {
    const currentId = get().currentUserId;
    if (currentId !== userId) {
      // User changed - clear all data and load for new user
      console.log('[Store] User changed from', currentId, 'to', userId);
      if (userId) {
        // New user logged in - clear old data
        set({
          currentUserId: userId,
          tours: [],
          gear: [],
          crew: [],
          crews: [],
          documents: [],
          tasks: [],
          chatHistory: [],
          activeTour: null,
          activeCrew: null,
        });
      } else {
        // User logged out - clear everything
        get().clearUserData();
      }
    }
  },
  setUserRole: (role) => {
    set({ currentUserRole: role });
    get().saveToStorage();
  },

  // Settings actions
  updateSettings: (newSettings) => {
    set((state) => ({ settings: { ...state.settings, ...newSettings } }));
    get().saveToStorage();
  },
  toggleStealthMode: () => {
    set((state) => ({
      settings: { ...state.settings, stealthMode: !state.settings.stealthMode },
    }));
  },

  // Permission helpers
  canEdit: () => get().currentUserRole === 'admin',
  canViewFinancials: () => {
    const state = get();
    return state.currentUserRole === 'admin' && !state.settings.stealthMode && !state.settings.hideFinancials;
  },

  // Tour actions
  setActiveTour: (tour) => set({ activeTour: tour }),
  addTour: (tour) => {
    set((state) => ({ tours: [...state.tours, tour] }));
    get().saveToStorage();
  },
  updateTour: (id, tourData) => {
    set((state) => ({
      tours: state.tours.map((t) => (t.id === id ? { ...t, ...tourData } : t)),
      activeTour: state.activeTour?.id === id ? { ...state.activeTour, ...tourData } : state.activeTour,
    }));
    get().saveToStorage();
  },
  deleteTour: (id) => {
    set((state) => ({
      tours: state.tours.filter((t) => t.id !== id),
      activeTour: state.activeTour?.id === id ? null : state.activeTour,
    }));
    get().saveToStorage();
  },
  setTours: (tours) => {
    set({ tours });
    get().saveToStorage();
  },

  // Show actions
  addShow: (tourId, show) => {
    set((state) => ({
      tours: state.tours.map((t) =>
        t.id === tourId ? { ...t, shows: [...t.shows, show] } : t
      ),
    }));
    get().saveToStorage();
  },
  updateShow: (tourId, showId, showData) => {
    set((state) => ({
      tours: state.tours.map((t) =>
        t.id === tourId
          ? {
              ...t,
              shows: t.shows.map((s) =>
                s.id === showId ? { ...s, ...showData } : s
              ),
            }
          : t
      ),
    }));
    get().saveToStorage();
  },
  deleteShow: (tourId, showId) => {
    set((state) => ({
      tours: state.tours.map((t) =>
        t.id === tourId
          ? { ...t, shows: t.shows.filter((s) => s.id !== showId) }
          : t
      ),
    }));
    get().saveToStorage();
  },

  // Gear actions
  addGear: (item) => {
    set((state) => ({ gear: [...state.gear, item] }));
    get().saveToStorage();
  },
  updateGear: (id, itemData) => {
    set((state) => ({
      gear: state.gear.map((g) => (g.id === id ? { ...g, ...itemData } : g)),
    }));
    get().saveToStorage();
  },
  deleteGear: (id) => {
    set((state) => ({ gear: state.gear.filter((g) => g.id !== id) }));
    get().saveToStorage();
  },

  // Input list actions
  setInputList: (list) => {
    set({ inputList: list });
    get().saveToStorage();
  },
  updateInputChannel: (channel, data) => {
    set((state) => ({
      inputList: state.inputList.map((c) =>
        c.channel === channel ? { ...c, ...data } : c
      ),
    }));
    get().saveToStorage();
  },

  // Crew actions
  addCrewMember: (member) => {
    set((state) => ({ crew: [...state.crew, member] }));
    get().saveToStorage();
  },
  updateCrewMember: (id, memberData) => {
    set((state) => ({
      crew: state.crew.map((c) => (c.id === id ? { ...c, ...memberData } : c)),
    }));
    get().saveToStorage();
  },
  deleteCrewMember: (id) => {
    set((state) => ({ crew: state.crew.filter((c) => c.id !== id) }));
    get().saveToStorage();
  },

  // Document actions
  addDocument: (doc) => {
    set((state) => ({ documents: [...state.documents, doc] }));
    get().saveToStorage();
  },
  updateDocument: (id, docData) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...docData } : d
      ),
    }));
    get().saveToStorage();
  },
  deleteDocument: (id) => {
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
    get().saveToStorage();
  },

  // Chat actions
  addChatMessage: (message) => {
    set((state) => ({ chatHistory: [...state.chatHistory, message] }));
  },
  clearChatHistory: () => set({ chatHistory: [] }),

  // Task actions
  addTask: (task) => {
    set((state) => ({ tasks: [...state.tasks, task] }));
    get().saveToStorage();
  },
  updateTask: (id, taskData) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...taskData } : t)),
    }));
    get().saveToStorage();
  },
  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    get().saveToStorage();
  },

  // Crew actions (band/artist crews)
  setActiveCrew: (crew) => set({ activeCrew: crew }),
  setCrews: (crews) => {
    set({ crews });
    get().saveToStorage();
  },
  addCrew: (crew) => {
    set((state) => ({ crews: [...state.crews, crew] }));
    get().saveToStorage();
  },
  updateCrew: (id, crewData) => {
    set((state) => ({
      crews: state.crews.map((c) => (c.id === id ? { ...c, ...crewData } : c)),
      activeCrew: state.activeCrew?.id === id ? { ...state.activeCrew, ...crewData } : state.activeCrew,
    }));
    get().saveToStorage();
  },
  deleteCrew: (id) => {
    set((state) => ({
      crews: state.crews.filter((c) => c.id !== id),
      activeCrew: state.activeCrew?.id === id ? null : state.activeCrew,
    }));
    get().saveToStorage();
  },
  addCrewMemberLink: (crewId, member) => {
    set((state) => ({
      crews: state.crews.map((c) =>
        c.id === crewId ? { ...c, members: [...c.members, member] } : c
      ),
    }));
    get().saveToStorage();
  },
  removeCrewMemberLink: (crewId, memberId) => {
    set((state) => ({
      crews: state.crews.map((c) =>
        c.id === crewId ? { ...c, members: c.members.filter((m) => m.id !== memberId) } : c
      ),
    }));
    get().saveToStorage();
  },
  addCrewDocument: (crewId, doc) => {
    set((state) => ({
      crews: state.crews.map((c) =>
        c.id === crewId ? { ...c, documents: [...c.documents, doc] } : c
      ),
    }));
    get().saveToStorage();
  },
  updateCrewDocument: (crewId, docId, docData) => {
    set((state) => ({
      crews: state.crews.map((c) =>
        c.id === crewId
          ? { ...c, documents: c.documents.map((d) => (d.id === docId ? { ...d, ...docData } : d)) }
          : c
      ),
    }));
    get().saveToStorage();
  },
  deleteCrewDocument: (crewId, docId) => {
    set((state) => ({
      crews: state.crews.map((c) =>
        c.id === crewId ? { ...c, documents: c.documents.filter((d) => d.id !== docId) } : c
      ),
    }));
    get().saveToStorage();
  },

  // User profile
  updateUserProfile: (profile) => {
    set((state) => ({ userProfile: { ...state.userProfile, ...profile } }));
    get().saveToStorage();
  },

  // Data Management
  resetData: () => {
    set({
      tours: [],
      gear: [],
      inputList: [],
      crew: [],
      documents: [],
      tasks: [],
      crews: [],
      activeTour: null,
      activeCrew: null,
    });
    get().saveToStorage();
    console.log('[Store] Data reset complete');
  },
  clearUserData: () => {
    set({
      currentUserId: null,
      tours: [],
      gear: [],
      inputList: [],
      crew: [],
      documents: [],
      tasks: [],
      crews: [],
      chatHistory: [],
      activeTour: null,
      activeCrew: null,
      currentUserRole: 'admin' as UserRole,
    });
    console.log('[Store] User data cleared');
  },

  // Storage
  loadFromStorage: async () => {
    try {
      // Clear any old data by checking version - v1.7.0 introduces user-scoped data
      const version = await AsyncStorage.getItem('tourflow-version');
      if (version !== '1.7.0') {
        // New version - clear old data to ensure user isolation
        await AsyncStorage.removeItem('tourflow-data');
        await AsyncStorage.setItem('tourflow-version', '1.7.0');
        console.log('[Store] Cleared old data for user isolation (v1.7.0)');
        return;
      }

      const data = await AsyncStorage.getItem('tourflow-data');
      if (data) {
        const parsed = JSON.parse(data);
        // IMPORTANT: Do NOT load tours from local storage
        // Tours must ONLY come from Supabase to ensure user isolation
        // Only load non-tour data (settings, user preferences)
        set({
          // DO NOT load: tours, gear, crew, documents, tasks
          // These must come from Supabase based on user permissions
          inputList: parsed.inputList || [],
          userProfile: parsed.userProfile || get().userProfile,
          settings: { ...get().settings, ...parsed.settings },
        });
        console.log('[Store] Loaded settings from storage (tours will sync from Supabase)');
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },
  saveToStorage: async () => {
    try {
      const state = get();
      await AsyncStorage.setItem(
        'tourflow-data',
        JSON.stringify({
          tours: state.tours,
          gear: state.gear,
          inputList: state.inputList,
          crew: state.crew,
          documents: state.documents,
          tasks: state.tasks,
          userProfile: state.userProfile,
          currentUserRole: state.currentUserRole,
          settings: state.settings,
        })
      );
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
}));
