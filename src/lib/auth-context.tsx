import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  User,
  Session,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  getCurrentSession,
  getCurrentUser,
  getStoredUser,
  isSupabaseConfigured,
  getUserTours,
  getPendingInvitations,
  acceptInvitation,
  resetPassword,
  getTourShows,
  getUserCrews,
  getCrewMembers,
  getCrewDocuments,
  getPendingCrewInvitations,
  acceptCrewInvitation,
} from './supabase';
import { useTourFlowStore, type Tour, type Show, type Crew, type CrewMemberLink, type CrewDocument } from './store';

// Types for tour membership
export interface TourMembership {
  tour_id: string;
  role: 'admin' | 'crew';
  can_view_financials: boolean;
  tour: {
    id: string;
    name: string;
    artist: string;
    start_date: string;
    end_date: string;
    status: string;
    notes: string | null;
    admin_id: string;
    crew_id: string | null;
  };
}

export interface PendingInvitation {
  id: string;
  tour_id: string;
  role: 'admin' | 'crew';
  tour: {
    name: string;
    artist: string;
  };
}

// Types for crew membership
export interface CrewMembership {
  crew_id: string;
  role: 'admin' | 'member';
  crew: {
    id: string;
    name: string;
    artist_name: string;
    created_at: string;
    updated_at: string;
    admin_id: string;
  };
}

export interface PendingCrewInvitation {
  id: string;
  crew_id: string;
  role: 'admin' | 'member';
  job_title: string | null;
  crew: {
    name: string;
    artist_name: string;
  };
}

interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSupabaseReady: boolean;

  // Tour memberships
  tourMemberships: TourMembership[];
  pendingInvitations: PendingInvitation[];

  // Crew memberships
  crewMemberships: CrewMembership[];
  pendingCrewInvitations: PendingCrewInvitation[];

  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; requiresVerification: boolean }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: string | null }>;

  // Tour methods
  refreshTourMemberships: () => Promise<void>;
  acceptTourInvitation: (invitationId: string) => Promise<{ error: string | null }>;

  // Crew methods
  refreshCrewMemberships: () => Promise<void>;
  acceptCrewInvitationHandler: (invitationId: string) => Promise<{ error: string | null }>;

  // Helpers
  isAdminOfTour: (tourId: string) => boolean;
  canViewFinancials: (tourId: string) => boolean;
  getMembershipForTour: (tourId: string) => TourMembership | undefined;
  isAdminOfCrew: (crewId: string) => boolean;
  getMembershipForCrew: (crewId: string) => CrewMembership | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tourMemberships, setTourMemberships] = useState<TourMembership[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [crewMemberships, setCrewMemberships] = useState<CrewMembership[]>([]);
  const [pendingCrewInvitations, setPendingCrewInvitations] = useState<PendingCrewInvitation[]>([]);

  const isSupabaseReady = isSupabaseConfigured();
  const isAuthenticated = Boolean(user && session);

  // Load initial session
  useEffect(() => {
    async function loadSession() {
      try {
        if (!isSupabaseReady) {
          setIsLoading(false);
          return;
        }

        const storedUser = await getStoredUser();
        const storedSession = await getCurrentSession();

        if (storedUser && storedSession) {
          setUser(storedUser);
          setSession(storedSession);

          // Verify session is still valid
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Session expired
            setUser(null);
            setSession(null);
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [isSupabaseReady]);

  // Load tour memberships when user changes
  useEffect(() => {
    if (user?.id && isSupabaseReady) {
      console.log('[Sync] User logged in, loading tour memberships...');
      refreshTourMemberships();
    } else {
      setTourMemberships([]);
      setPendingInvitations([]);
    }
  }, [user?.id, isSupabaseReady]);

  // Load crew memberships when user changes
  useEffect(() => {
    if (user?.id && isSupabaseReady) {
      console.log('[Sync] User logged in, loading crew memberships...');
      refreshCrewMemberships();
    } else {
      setCrewMemberships([]);
      setPendingCrewInvitations([]);
    }
  }, [user?.id, isSupabaseReady]);

  const refreshTourMemberships = useCallback(async () => {
    if (!user?.id) return;

    console.log('[Sync] Refreshing tour memberships for user:', user.id);

    // Get store methods
    const { setCurrentUserId, setTours } = useTourFlowStore.getState();

    // Set current user ID in store (this clears old data if user changed)
    setCurrentUserId(user.id);

    try {
      // Fetch tour memberships
      const { data: memberships } = await getUserTours(user.id);
      console.log('[Sync] Fetched memberships:', memberships?.length || 0);

      if (memberships) {
        const formatted: TourMembership[] = memberships.map((m) => ({
          tour_id: m.tour_id,
          role: m.role,
          can_view_financials: m.can_view_financials,
          tour: {
            id: m.tours.id,
            name: m.tours.name,
            artist: m.tours.artist,
            start_date: m.tours.start_date,
            end_date: m.tours.end_date,
            status: m.tours.status,
            notes: m.tours.notes,
            admin_id: m.tours.admin_id,
            crew_id: m.tours.crew_id,
          },
        }));
        setTourMemberships(formatted);
        console.log('[Sync] Updated tour memberships:', formatted.map(m => ({ name: m.tour.name, role: m.role })));

        // Sync tours to the store - fetch shows for each tour
        const toursWithShows: Tour[] = await Promise.all(
          formatted.map(async (membership) => {
            const { data: shows } = await getTourShows(membership.tour_id);
            const formattedShows: Show[] = (shows || []).map((s) => ({
              id: s.id,
              tourId: s.tour_id,
              venue: s.venue,
              city: s.city,
              state: s.state || '',
              country: s.country || 'USA',
              date: s.date,
              loadIn: s.load_in || '10:00',
              soundcheck: s.soundcheck || '16:00',
              doors: s.doors || '19:00',
              showTime: s.show_time || '20:00',
              curfew: s.curfew || '23:00',
              status: s.status as 'confirmed' | 'pending' | 'cancelled',
              venueContact: s.venue_contact || '',
              venuePhone: s.venue_phone || '',
              venueEmail: s.venue_email || '',
              capacity: s.capacity || 0,
              notes: s.notes || '',
            }));

            return {
              id: membership.tour.id,
              name: membership.tour.name,
              artist: membership.tour.artist,
              startDate: membership.tour.start_date,
              endDate: membership.tour.end_date,
              status: membership.tour.status as 'upcoming' | 'active' | 'completed',
              notes: membership.tour.notes || '',
              shows: formattedShows,
              crew: [], // Crew will be loaded separately if needed
              crewId: membership.tour.crew_id || undefined,
            };
          })
        );

        // Update store with user's tours
        setTours(toursWithShows);
        console.log('[Sync] Synced', toursWithShows.length, 'tours to store with shows');
      } else {
        // No memberships - clear tours
        setTours([]);
      }

      // Fetch pending invitations
      if (user.email) {
        console.log('[Sync] Checking pending invitations for:', user.email);
        const { data: invitations } = await getPendingInvitations(user.email);
        console.log('[Sync] Found pending invitations:', invitations?.length || 0);

        if (invitations) {
          const formattedInvitations: PendingInvitation[] = invitations.map((inv) => ({
            id: inv.id,
            tour_id: inv.tour_id,
            role: inv.role,
            tour: {
              name: inv.tours.name,
              artist: inv.tours.artist,
            },
          }));
          setPendingInvitations(formattedInvitations);
        }
      }
    } catch (error) {
      console.error('[Sync] Error refreshing tour memberships:', error);
    }
  }, [user?.id, user?.email]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        return { error: error.message };
      }

      if (data?.user && data?.session) {
        setUser(data.user);
        setSession(data.session);
        return { error: null };
      }

      return { error: 'Sign in failed. Please try again.' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: string | null; requiresVerification: boolean }> => {
    try {
      console.log('[Auth] Initiating sign up...');
      const { data, error } = await signUpWithEmail(email, password, fullName);

      console.log('[Auth] Sign up result:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        hasError: !!error,
        errorMsg: error?.message
      });

      if (error) {
        return { error: error.message, requiresVerification: false };
      }

      // If session is null but user exists, email verification is required
      if (data?.user && !data?.session) {
        console.log('[Auth] Email verification required');
        return { error: null, requiresVerification: true };
      }

      if (data?.user && data?.session) {
        setUser(data.user);
        setSession(data.session);
        console.log('[Auth] User auto-signed in after signup');
        return { error: null, requiresVerification: false };
      }

      return { error: 'Sign up failed. Please try again.', requiresVerification: false };
    } catch (error) {
      console.error('[Auth] Sign up exception:', error);
      return { error: error instanceof Error ? error.message : 'An unexpected error occurred', requiresVerification: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    setUser(null);
    setSession(null);
    setTourMemberships([]);
    setPendingInvitations([]);
    setCrewMemberships([]);
    setPendingCrewInvitations([]);

    // Clear user data from store
    const { clearUserData } = useTourFlowStore.getState();
    clearUserData();
    console.log('[Auth] User signed out, store data cleared');
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await resetPassword(email);
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  }, []);

  const acceptTourInvitation = useCallback(async (invitationId: string): Promise<{ error: string | null }> => {
    if (!user?.id) {
      console.log('[Sync] Cannot accept invitation - user not logged in');
      return { error: 'You must be logged in to accept invitations' };
    }

    console.log('[Sync] Accepting invitation:', invitationId, 'for user:', user.id);

    try {
      const { error } = await acceptInvitation(invitationId, user.id);
      if (error) {
        console.log('[Sync] Error accepting invitation:', error.message);
        return { error: error.message };
      }

      console.log('[Sync] Invitation accepted successfully, refreshing memberships...');
      // Refresh memberships to include new tour
      await refreshTourMemberships();
      return { error: null };
    } catch (error) {
      console.error('[Sync] Exception accepting invitation:', error);
      return { error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  }, [user?.id, refreshTourMemberships]);

  const isAdminOfTour = useCallback((tourId: string): boolean => {
    const membership = tourMemberships.find((m) => m.tour_id === tourId);
    return membership?.role === 'admin';
  }, [tourMemberships]);

  const canViewFinancials = useCallback((tourId: string): boolean => {
    const membership = tourMemberships.find((m) => m.tour_id === tourId);
    return membership?.can_view_financials ?? false;
  }, [tourMemberships]);

  const getMembershipForTour = useCallback((tourId: string): TourMembership | undefined => {
    return tourMemberships.find((m) => m.tour_id === tourId);
  }, [tourMemberships]);

  // Crew-related methods
  const refreshCrewMemberships = useCallback(async () => {
    if (!user?.id) return;

    console.log('[Sync] Refreshing crew memberships for user:', user.id);

    const { setCrews } = useTourFlowStore.getState();

    try {
      // Fetch crew memberships
      const { data: memberships } = await getUserCrews(user.id);
      console.log('[Sync] Fetched crew memberships:', memberships?.length || 0);

      if (memberships) {
        const formatted: CrewMembership[] = memberships.map((m) => ({
          crew_id: m.crew_id,
          role: m.role,
          crew: {
            id: m.crews.id,
            name: m.crews.name,
            artist_name: m.crews.artist_name,
            created_at: m.crews.created_at,
            updated_at: m.crews.updated_at,
            admin_id: m.crews.admin_id,
          },
        }));
        setCrewMemberships(formatted);
        console.log('[Sync] Updated crew memberships:', formatted.map(m => ({ name: m.crew.name, role: m.role })));

        // Sync crews to the store - fetch members and documents for each crew
        const crewsWithData: Crew[] = await Promise.all(
          formatted.map(async (membership) => {
            const [{ data: membersData }, { data: docsData }] = await Promise.all([
              getCrewMembers(membership.crew_id),
              getCrewDocuments(membership.crew_id),
            ]);

            const members: CrewMemberLink[] = (membersData || []).map((m) => ({
              id: m.id,
              crewId: membership.crew_id,
              userId: m.user_id,
              role: m.role,
              email: m.profiles?.email || '',
              name: m.profiles?.full_name || 'Unknown',
              phone: m.profiles?.phone || undefined,
              jobTitle: m.job_title || undefined,
              joinedAt: m.joined_at,
            }));

            const documents: CrewDocument[] = (docsData || []).map((d) => ({
              id: d.id,
              crewId: d.crew_id,
              name: d.name,
              type: d.type as CrewDocument['type'],
              content: d.content,
              createdAt: d.created_at,
              updatedAt: d.updated_at,
            }));

            return {
              id: membership.crew.id,
              name: membership.crew.name,
              artistName: membership.crew.artist_name,
              createdAt: membership.crew.created_at,
              updatedAt: membership.crew.updated_at,
              members,
              documents,
            };
          })
        );

        // Update store with user's crews
        setCrews(crewsWithData);
        console.log('[Sync] Synced', crewsWithData.length, 'crews to store');
      } else {
        // No memberships - clear crews
        setCrews([]);
      }

      // Fetch pending crew invitations
      if (user.email) {
        console.log('[Sync] Checking pending crew invitations for:', user.email);
        const { data: invitations } = await getPendingCrewInvitations(user.email);
        console.log('[Sync] Found pending crew invitations:', invitations?.length || 0);

        if (invitations) {
          const formattedInvitations: PendingCrewInvitation[] = invitations.map((inv) => ({
            id: inv.id,
            crew_id: inv.crew_id,
            role: inv.role,
            job_title: inv.job_title,
            crew: {
              name: inv.crews.name,
              artist_name: inv.crews.artist_name,
            },
          }));
          setPendingCrewInvitations(formattedInvitations);
        }
      }
    } catch (error) {
      console.error('[Sync] Error refreshing crew memberships:', error);
    }
  }, [user?.id, user?.email]);

  const acceptCrewInvitationHandler = useCallback(async (invitationId: string): Promise<{ error: string | null }> => {
    if (!user?.id) {
      console.log('[Sync] Cannot accept crew invitation - user not logged in');
      return { error: 'You must be logged in to accept invitations' };
    }

    console.log('[Sync] Accepting crew invitation:', invitationId, 'for user:', user.id);

    try {
      const { error } = await acceptCrewInvitation(invitationId, user.id);
      if (error) {
        console.log('[Sync] Error accepting crew invitation:', error.message);
        return { error: error.message };
      }

      console.log('[Sync] Crew invitation accepted successfully, refreshing memberships...');
      await refreshCrewMemberships();
      return { error: null };
    } catch (error) {
      console.error('[Sync] Exception accepting crew invitation:', error);
      return { error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  }, [user?.id, refreshCrewMemberships]);

  const isAdminOfCrew = useCallback((crewId: string): boolean => {
    const membership = crewMemberships.find((m) => m.crew_id === crewId);
    return membership?.role === 'admin';
  }, [crewMemberships]);

  const getMembershipForCrew = useCallback((crewId: string): CrewMembership | undefined => {
    return crewMemberships.find((m) => m.crew_id === crewId);
  }, [crewMemberships]);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    isSupabaseReady,
    tourMemberships,
    pendingInvitations,
    crewMemberships,
    pendingCrewInvitations,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    refreshTourMemberships,
    acceptTourInvitation,
    refreshCrewMemberships,
    acceptCrewInvitationHandler,
    isAdminOfTour,
    canViewFinancials,
    getMembershipForTour,
    isAdminOfCrew,
    getMembershipForCrew,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking if user has access to a specific tour
export function useTourAccess(tourId: string | undefined) {
  const { tourMemberships, isAdminOfTour, canViewFinancials, isAuthenticated } = useAuth();

  if (!tourId) {
    return {
      hasAccess: false,
      isAdmin: false,
      canViewFinancials: false,
      membership: undefined,
    };
  }

  const membership = tourMemberships.find((m) => m.tour_id === tourId);

  return {
    hasAccess: Boolean(membership),
    isAdmin: isAdminOfTour(tourId),
    canViewFinancials: canViewFinancials(tourId),
    membership,
    isAuthenticated,
  };
}
