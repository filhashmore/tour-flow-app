import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration - Get these from your Supabase project settings
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Types for Auth
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: unknown;
  };
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token?: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface PostgrestError {
  message: string;
  code?: string;
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Storage adapter for sessions
const SESSION_KEY = 'tourflow-session';
const USER_KEY = 'tourflow-user';

export async function saveSession(session: Session | null): Promise<void> {
  try {
    if (session) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(session.user));
    } else {
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    }
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

export async function getStoredSession(): Promise<Session | null> {
  try {
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch {
    return null;
  }
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

// Parse user-friendly error messages from Supabase error responses
function parseAuthError(data: Record<string, unknown>, statusCode: number): string {
  const errorCode = data.error_code || data.code || '';
  const errorMsg = data.msg || data.message || data.error_description || data.error || '';

  // Log full error for debugging
  console.log('[Supabase Auth Error]', JSON.stringify({ statusCode, errorCode, errorMsg, data }, null, 2));

  // Map common error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password. Please check your credentials and try again.',
    'email_not_confirmed': 'Please verify your email address before signing in. Check your inbox for a confirmation link.',
    'user_not_found': 'No account found with this email. Please sign up first.',
    'user_already_exists': 'An account with this email already exists. Try signing in instead.',
    'invalid_grant': 'Invalid email or password. Please check your credentials.',
    'email_address_invalid': 'Please enter a valid email address.',
    'weak_password': 'Password is too weak. Use at least 6 characters with a mix of letters and numbers.',
    'over_request_rate_limit': 'Too many attempts. Please wait a moment and try again.',
    'signup_disabled': 'Sign up is currently disabled. Please contact support.',
    'email_provider_disabled': 'Email sign up is not enabled. Please contact support.',
    'validation_failed': 'Please check your input and try again.',
  };

  // Check for specific error codes
  if (typeof errorCode === 'string' && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  // Check for error messages that match known patterns
  const errorMsgLower = String(errorMsg).toLowerCase();

  if (errorMsgLower.includes('invalid login credentials') || errorMsgLower.includes('invalid_credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (errorMsgLower.includes('email not confirmed') || errorMsgLower.includes('email_not_confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox for a confirmation link.';
  }
  if (errorMsgLower.includes('user already registered') || errorMsgLower.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (errorMsgLower.includes('rate limit') || errorMsgLower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (errorMsgLower.includes('network') || errorMsgLower.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (errorMsgLower.includes('password') && errorMsgLower.includes('weak')) {
    return 'Password is too weak. Use at least 6 characters.';
  }

  // Handle HTTP status codes
  if (statusCode === 401) {
    return 'Invalid credentials. Please check your email and password.';
  }
  if (statusCode === 422) {
    return String(errorMsg) || 'Invalid input. Please check your information and try again.';
  }
  if (statusCode === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (statusCode >= 500) {
    return 'Server error. Please try again later.';
  }

  // Return the original message if no mapping found
  return String(errorMsg) || 'Request failed. Please try again.';
}

// API helpers for Supabase REST API (no SDK needed)
async function supabaseRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    accessToken?: string;
  } = {}
): Promise<{ data: T | null; error: PostgrestError | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in ENV tab.' } };
  }

  const { method = 'GET', body, headers = {}, accessToken } = options;
  const fullUrl = `${SUPABASE_URL}${endpoint}`;

  // Log request for debugging (without sensitive data)
  console.log(`[Supabase Request] ${method} ${endpoint}`);

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let data: Record<string, unknown>;
    const responseText = await response.text();

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      console.log('[Supabase] Non-JSON response:', responseText.substring(0, 200));
      data = { message: responseText || 'Unknown error' };
    }

    if (!response.ok) {
      const errorMessage = endpoint.includes('/auth/')
        ? parseAuthError(data, response.status)
        : String(data.message || data.error_description || 'Request failed');

      return {
        data: null,
        error: {
          message: errorMessage,
          code: String(data.code || data.error_code || response.status)
        }
      };
    }

    console.log(`[Supabase Response] ${method} ${endpoint} - Success`);
    return { data: data as T, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    console.log('[Supabase Network Error]', errorMessage);

    // Provide user-friendly network error messages
    if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
      return { data: null, error: { message: 'Unable to connect. Please check your internet connection and try again.' } };
    }

    return { data: null, error: { message: errorMessage } };
  }
}

// Auth functions using Supabase REST API
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }> {
  console.log('[Supabase] Attempting sign up for:', email);

  const { data, error } = await supabaseRequest<{ user: User; session: Session; access_token?: string; refresh_token?: string }>('/auth/v1/signup', {
    method: 'POST',
    body: {
      email,
      password,
      data: { full_name: fullName },
    },
  });

  // Log response for debugging
  console.log('[Supabase Sign Up Response]', JSON.stringify({
    hasUser: !!data?.user,
    hasSession: !!data?.session,
    hasAccessToken: !!data?.access_token,
    userId: data?.user?.id,
    error: error?.message
  }, null, 2));

  if (error) {
    return { data: null, error };
  }

  // Handle case where user is returned but session is null (email confirmation required)
  if (data?.user && !data?.session && !data?.access_token) {
    console.log('[Supabase] Sign up successful - email confirmation required');
    return { data: { user: data.user, session: null }, error: null };
  }

  // Build session from response (some Supabase configs return access_token directly)
  if (data?.access_token) {
    const session: Session = {
      user: data.user,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
    await saveSession(session);
    console.log('[Supabase] Sign up successful - auto signed in');
    return { data: { user: data.user, session }, error: null };
  }

  if (data?.session) {
    await saveSession(data.session);
    console.log('[Supabase] Sign up successful with session');
    return { data: { user: data.user, session: data.session }, error: null };
  }

  // Return user without session if email confirmation is required
  if (data?.user) {
    return { data: { user: data.user, session: null }, error: null };
  }

  return { data: null, error: { message: 'Sign up failed. Please try again.' } };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }> {
  console.log('[Supabase] Attempting sign in for:', email);

  const { data, error } = await supabaseRequest<{ user: User; session: Session; access_token: string; refresh_token: string }>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });

  // Log response for debugging
  console.log('[Supabase Sign In Response]', JSON.stringify({
    hasUser: !!data?.user,
    hasAccessToken: !!data?.access_token,
    userId: data?.user?.id,
    error: error?.message
  }, null, 2));

  if (error) {
    return { data: null, error };
  }

  if (data?.access_token) {
    const session: Session = {
      user: data.user,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
    await saveSession(session);
    console.log('[Supabase] Sign in successful');
    return { data: { user: data.user, session }, error: null };
  }

  return { data: null, error: { message: 'Sign in failed. Please try again.' } };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const session = await getStoredSession();

  if (session?.access_token) {
    await supabaseRequest('/auth/v1/logout', {
      method: 'POST',
      accessToken: session.access_token,
    });
  }

  await saveSession(null);
  return { error: null };
}

export async function resetPassword(email: string): Promise<{ data: unknown; error: AuthError | null }> {
  return supabaseRequest('/auth/v1/recover', {
    method: 'POST',
    body: { email },
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getStoredSession();
  if (!session?.access_token) return null;

  const { data } = await supabaseRequest<{ user: User }>('/auth/v1/user', {
    accessToken: session.access_token,
  });

  return data?.user || null;
}

export async function getCurrentSession(): Promise<Session | null> {
  return getStoredSession();
}

// Database query helpers
async function dbQuery<T>(
  table: string,
  options: {
    select?: string;
    filter?: Record<string, unknown>;
    single?: boolean;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
  } = {}
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const session = await getStoredSession();
  const { select = '*', filter = {}, single = false, method = 'GET', body } = options;

  let endpoint = `/rest/v1/${table}?select=${encodeURIComponent(select)}`;

  // Add filters
  Object.entries(filter).forEach(([key, value]) => {
    endpoint += `&${key}=eq.${value}`;
  });

  if (single) {
    endpoint += '&limit=1';
  }

  const headers: Record<string, string> = {};
  if (single) {
    headers['Accept'] = 'application/vnd.pgrst.object+json';
  }
  if (method === 'POST') {
    headers['Prefer'] = 'return=representation';
  }

  const result = await supabaseRequest<T>(endpoint, {
    method,
    body,
    headers,
    accessToken: session?.access_token,
  });

  return result;
}

// Profile helpers
export async function getUserProfile(userId: string) {
  return dbQuery<{
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: string | null;
  }>('profiles', {
    filter: { id: userId },
    single: true,
  });
}

export async function updateUserProfile(userId: string, updates: {
  full_name?: string;
  role?: string;
  phone?: string;
  preferred_console?: string;
  preferred_mics?: string[];
}) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    body: updates,
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });
}

// Tour member helpers
export async function getUserTours(userId: string) {
  return dbQuery<Array<{
    tour_id: string;
    role: 'admin' | 'crew';
    can_view_financials: boolean;
    tours: {
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
  }>>('tour_members', {
    select: 'tour_id,role,can_view_financials,tours(id,name,artist,start_date,end_date,status,notes,admin_id,crew_id)',
    filter: { user_id: userId },
  });
}

export async function getTourMembers(tourId: string) {
  return dbQuery<Array<{
    id: string;
    user_id: string;
    role: 'admin' | 'crew';
    can_view_financials: boolean;
    profiles: {
      id: string;
      full_name: string | null;
      email: string;
      phone: string | null;
      role: string | null;
    };
  }>>('tour_members', {
    select: 'id,user_id,role,can_view_financials,profiles(id,full_name,email,phone,role)',
    filter: { tour_id: tourId },
  });
}

// Invitation helpers
export async function inviteUserToTour(email: string, tourId: string, role: 'admin' | 'crew' = 'crew', canViewFinancials: boolean = false) {
  const session = await getStoredSession();

  console.log('[Invite] Starting invitation process for:', email, 'to tour:', tourId, 'as:', role);

  // First check if user exists
  const { data: existingUsers } = await supabaseRequest<Array<{ id: string }>>(`/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`, {
    accessToken: session?.access_token,
  });

  const existingUser = existingUsers?.[0];

  if (existingUser) {
    console.log('[Invite] User exists, adding directly to tour:', existingUser.id);

    // User exists - add them directly to tour
    const { data, error } = await supabaseRequest<{ id: string }>('/rest/v1/tour_members', {
      method: 'POST',
      body: {
        tour_id: tourId,
        user_id: existingUser.id,
        role,
        can_view_financials: role === 'admin' ? true : canViewFinancials,
      },
      headers: { 'Prefer': 'return=representation' },
      accessToken: session?.access_token,
    });

    if (error) {
      console.log('[Invite] Error adding user to tour:', error.message);
    } else {
      console.log('[Invite] User added to tour successfully');
    }

    return { data, error, invited: false };
  } else {
    console.log('[Invite] User does not exist, creating invitation');

    // User doesn't exist - create invitation
    const { data, error } = await supabaseRequest<{ id: string }>('/rest/v1/invitations', {
      method: 'POST',
      body: {
        email,
        tour_id: tourId,
        role,
        can_view_financials: role === 'admin' ? true : canViewFinancials,
        status: 'pending',
      },
      headers: { 'Prefer': 'return=representation' },
      accessToken: session?.access_token,
    });

    if (error) {
      console.log('[Invite] Error creating invitation:', error.message);
    } else {
      console.log('[Invite] Invitation created successfully, ID:', data?.id);
      // Note: Email sending would be handled by a Supabase Edge Function or webhook
      // that triggers on new rows in the invitations table
    }

    return { data, error, invited: true };
  }
}

export async function getPendingInvitations(email: string) {
  return dbQuery<Array<{
    id: string;
    tour_id: string;
    role: 'admin' | 'crew';
    tours: {
      name: string;
      artist: string;
    };
  }>>('invitations', {
    select: 'id,tour_id,role,tours(name,artist)',
    filter: { email, status: 'pending' },
  });
}

export async function acceptInvitation(invitationId: string, userId: string) {
  const session = await getStoredSession();

  // Get invitation details
  const { data: invitations } = await supabaseRequest<Array<{ tour_id: string; role: string }>>(`/rest/v1/invitations?id=eq.${invitationId}&select=tour_id,role`, {
    accessToken: session?.access_token,
  });

  const invitation = invitations?.[0];
  if (!invitation) {
    return { error: { message: 'Invitation not found' } };
  }

  // Add user to tour
  const { error: memberError } = await supabaseRequest('/rest/v1/tour_members', {
    method: 'POST',
    body: {
      tour_id: invitation.tour_id,
      user_id: userId,
      role: invitation.role,
    },
    accessToken: session?.access_token,
  });

  if (memberError) {
    return { error: memberError };
  }

  // Update invitation status
  const { error: updateError } = await supabaseRequest(`/rest/v1/invitations?id=eq.${invitationId}`, {
    method: 'PATCH',
    body: { status: 'accepted' },
    accessToken: session?.access_token,
  });

  return { error: updateError };
}

// Tour CRUD
export async function createTour(tour: {
  name: string;
  artist: string;
  start_date: string;
  end_date: string;
  notes?: string;
}, adminId: string) {
  const session = await getStoredSession();

  const { data, error } = await supabaseRequest<{ id: string }>('/rest/v1/tours', {
    method: 'POST',
    body: {
      ...tour,
      admin_id: adminId,
      status: 'upcoming',
    },
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });

  if (data && !error) {
    // Auto-add creator as admin member
    await supabaseRequest('/rest/v1/tour_members', {
      method: 'POST',
      body: {
        tour_id: data.id,
        user_id: adminId,
        role: 'admin',
        can_view_financials: true,
      },
      accessToken: session?.access_token,
    });
  }

  return { data, error };
}

export async function updateTour(tourId: string, updates: Partial<{
  name: string;
  artist: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
}>) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/tours?id=eq.${tourId}`, {
    method: 'PATCH',
    body: updates,
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });
}

export async function deleteTour(tourId: string) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/tours?id=eq.${tourId}`, {
    method: 'DELETE',
    accessToken: session?.access_token,
  });
}

// Shows CRUD
export async function getTourShows(tourId: string) {
  const session = await getStoredSession();

  return supabaseRequest<Array<{
    id: string;
    tour_id: string;
    venue: string;
    city: string;
    state: string;
    country: string;
    date: string;
    load_in: string | null;
    soundcheck: string | null;
    doors: string | null;
    show_time: string | null;
    curfew: string | null;
    status: string;
    venue_contact: string | null;
    venue_phone: string | null;
    venue_email: string | null;
    capacity: number | null;
    notes: string | null;
  }>>(`/rest/v1/shows?tour_id=eq.${tourId}&select=*&order=date.asc`, {
    accessToken: session?.access_token,
  });
}

export async function createShow(show: {
  tour_id: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  date: string;
  load_in?: string;
  soundcheck?: string;
  doors?: string;
  show_time?: string;
  curfew?: string;
  status?: string;
  venue_contact?: string;
  venue_phone?: string;
  venue_email?: string;
  capacity?: number;
  notes?: string;
}) {
  const session = await getStoredSession();

  return supabaseRequest('/rest/v1/shows', {
    method: 'POST',
    body: show,
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });
}

export async function updateShow(showId: string, updates: Partial<{
  venue: string;
  city: string;
  state: string;
  country: string;
  date: string;
  load_in: string;
  soundcheck: string;
  doors: string;
  show_time: string;
  curfew: string;
  status: string;
  venue_contact: string;
  venue_phone: string;
  venue_email: string;
  capacity: number;
  notes: string;
}>) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/shows?id=eq.${showId}`, {
    method: 'PATCH',
    body: updates,
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });
}

export async function deleteShow(showId: string) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/shows?id=eq.${showId}`, {
    method: 'DELETE',
    accessToken: session?.access_token,
  });
}

// Settlements (admin only)
export async function getShowSettlement(showId: string) {
  return dbQuery<{
    id: string;
    show_id: string;
    guarantee: number;
    bonus: number;
    merch: number;
    expenses: number;
    per_diem: number;
    total: number;
  }>('settlements', {
    filter: { show_id: showId },
    single: true,
  });
}

export async function upsertSettlement(settlement: {
  show_id: string;
  guarantee: number;
  bonus: number;
  merch: number;
  expenses: number;
  per_diem: number;
  total: number;
}) {
  const session = await getStoredSession();

  // Try update first, then insert if not found
  const { data: existing } = await getShowSettlement(settlement.show_id);

  if (existing) {
    return supabaseRequest(`/rest/v1/settlements?show_id=eq.${settlement.show_id}`, {
      method: 'PATCH',
      body: settlement,
      headers: { 'Prefer': 'return=representation' },
      accessToken: session?.access_token,
    });
  } else {
    return supabaseRequest('/rest/v1/settlements', {
      method: 'POST',
      body: settlement,
      headers: { 'Prefer': 'return=representation' },
      accessToken: session?.access_token,
    });
  }
}

// ==================== CREWS API ====================

// Get all crews user is a member of
export async function getUserCrews(userId: string) {
  return dbQuery<Array<{
    crew_id: string;
    role: 'admin' | 'member';
    crews: {
      id: string;
      name: string;
      artist_name: string;
      created_at: string;
      updated_at: string;
      admin_id: string;
    };
  }>>('crew_members', {
    select: 'crew_id,role,crews(id,name,artist_name,created_at,updated_at,admin_id)',
    filter: { user_id: userId },
  });
}

// Get crew members
export async function getCrewMembers(crewId: string) {
  return dbQuery<Array<{
    id: string;
    user_id: string;
    role: 'admin' | 'member';
    job_title: string | null;
    joined_at: string;
    profiles: {
      id: string;
      full_name: string | null;
      email: string;
      phone: string | null;
    };
  }>>('crew_members', {
    select: 'id,user_id,role,job_title,joined_at,profiles(id,full_name,email,phone)',
    filter: { crew_id: crewId },
  });
}

// Create a new crew
export async function createCrew(crew: {
  name: string;
  artist_name: string;
}, adminId: string) {
  const session = await getStoredSession();

  const { data, error } = await supabaseRequest<{ id: string }>('/rest/v1/crews', {
    method: 'POST',
    body: {
      ...crew,
      admin_id: adminId,
    },
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });

  if (data && !error) {
    // Auto-add creator as admin member
    await supabaseRequest('/rest/v1/crew_members', {
      method: 'POST',
      body: {
        crew_id: data.id,
        user_id: adminId,
        role: 'admin',
      },
      accessToken: session?.access_token,
    });
  }

  return { data, error };
}

// Update a crew
export async function updateCrew(crewId: string, updates: Partial<{
  name: string;
  artist_name: string;
}>) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/crews?id=eq.${crewId}`, {
    method: 'PATCH',
    body: { ...updates, updated_at: new Date().toISOString() },
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });
}

// Delete a crew
export async function deleteCrew(crewId: string) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/crews?id=eq.${crewId}`, {
    method: 'DELETE',
    accessToken: session?.access_token,
  });
}

// Invite user to crew
export async function inviteUserToCrew(email: string, crewId: string, role: 'admin' | 'member' = 'member', jobTitle?: string) {
  const session = await getStoredSession();

  console.log('[Crew Invite] Starting invitation process for:', email, 'to crew:', crewId, 'as:', role);

  // First check if user exists
  const { data: existingUsers } = await supabaseRequest<Array<{ id: string }>>(`/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`, {
    accessToken: session?.access_token,
  });

  const existingUser = existingUsers?.[0];

  if (existingUser) {
    console.log('[Crew Invite] User exists, adding directly to crew:', existingUser.id);

    // User exists - add them directly to crew
    const { data, error } = await supabaseRequest<{ id: string }>('/rest/v1/crew_members', {
      method: 'POST',
      body: {
        crew_id: crewId,
        user_id: existingUser.id,
        role,
        job_title: jobTitle || null,
      },
      headers: { 'Prefer': 'return=representation' },
      accessToken: session?.access_token,
    });

    if (error) {
      console.log('[Crew Invite] Error adding user to crew:', error.message);
    } else {
      console.log('[Crew Invite] User added to crew successfully');
    }

    return { data, error, invited: false };
  } else {
    console.log('[Crew Invite] User does not exist, creating crew invitation');

    // User doesn't exist - create crew invitation
    const { data, error } = await supabaseRequest<{ id: string }>('/rest/v1/crew_invitations', {
      method: 'POST',
      body: {
        email,
        crew_id: crewId,
        role,
        job_title: jobTitle || null,
        status: 'pending',
      },
      headers: { 'Prefer': 'return=representation' },
      accessToken: session?.access_token,
    });

    if (error) {
      console.log('[Crew Invite] Error creating invitation:', error.message);
    } else {
      console.log('[Crew Invite] Invitation created successfully, ID:', data?.id);
    }

    return { data, error, invited: true };
  }
}

// Get pending crew invitations for a user
export async function getPendingCrewInvitations(email: string) {
  return dbQuery<Array<{
    id: string;
    crew_id: string;
    role: 'admin' | 'member';
    job_title: string | null;
    crews: {
      name: string;
      artist_name: string;
    };
  }>>('crew_invitations', {
    select: 'id,crew_id,role,job_title,crews(name,artist_name)',
    filter: { email, status: 'pending' },
  });
}

// Accept crew invitation
export async function acceptCrewInvitation(invitationId: string, userId: string) {
  const session = await getStoredSession();

  // Get invitation details
  const { data: invitations } = await supabaseRequest<Array<{ crew_id: string; role: string; job_title: string | null }>>(`/rest/v1/crew_invitations?id=eq.${invitationId}&select=crew_id,role,job_title`, {
    accessToken: session?.access_token,
  });

  const invitation = invitations?.[0];
  if (!invitation) {
    return { error: { message: 'Invitation not found' } };
  }

  // Add user to crew
  const { error: memberError } = await supabaseRequest('/rest/v1/crew_members', {
    method: 'POST',
    body: {
      crew_id: invitation.crew_id,
      user_id: userId,
      role: invitation.role,
      job_title: invitation.job_title,
    },
    accessToken: session?.access_token,
  });

  if (memberError) {
    return { error: memberError };
  }

  // Update invitation status
  const { error: updateError } = await supabaseRequest(`/rest/v1/crew_invitations?id=eq.${invitationId}`, {
    method: 'PATCH',
    body: { status: 'accepted' },
    accessToken: session?.access_token,
  });

  return { error: updateError };
}

// Remove member from crew
export async function removeCrewMember(crewId: string, userId: string) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/crew_members?crew_id=eq.${crewId}&user_id=eq.${userId}`, {
    method: 'DELETE',
    accessToken: session?.access_token,
  });
}

// Update crew member role
export async function updateCrewMemberRole(crewId: string, userId: string, role: 'admin' | 'member', jobTitle?: string) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/crew_members?crew_id=eq.${crewId}&user_id=eq.${userId}`, {
    method: 'PATCH',
    body: { role, job_title: jobTitle || null },
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });
}

// ==================== CREW DOCUMENTS API ====================

// Get crew documents
export async function getCrewDocuments(crewId: string) {
  const session = await getStoredSession();

  return supabaseRequest<Array<{
    id: string;
    crew_id: string;
    name: string;
    type: string;
    content: string;
    created_at: string;
    updated_at: string;
  }>>(`/rest/v1/crew_documents?crew_id=eq.${crewId}&select=*&order=created_at.desc`, {
    accessToken: session?.access_token,
  });
}

// Create crew document
export async function createCrewDocument(doc: {
  crew_id: string;
  name: string;
  type: string;
  content: string;
}) {
  const session = await getStoredSession();

  return supabaseRequest('/rest/v1/crew_documents', {
    method: 'POST',
    body: doc,
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });
}

// Update crew document
export async function updateCrewDocument(docId: string, updates: Partial<{
  name: string;
  type: string;
  content: string;
}>) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/crew_documents?id=eq.${docId}`, {
    method: 'PATCH',
    body: { ...updates, updated_at: new Date().toISOString() },
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });
}

// Delete crew document
export async function deleteCrewDocument(docId: string) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/crew_documents?id=eq.${docId}`, {
    method: 'DELETE',
    accessToken: session?.access_token,
  });
}

// ==================== TOURS-CREWS LINK ====================

// Link a tour to a crew
export async function linkTourToCrew(tourId: string, crewId: string) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/tours?id=eq.${tourId}`, {
    method: 'PATCH',
    body: { crew_id: crewId },
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });
}

// Unlink a tour from a crew
export async function unlinkTourFromCrew(tourId: string) {
  const session = await getStoredSession();

  return supabaseRequest(`/rest/v1/tours?id=eq.${tourId}`, {
    method: 'PATCH',
    body: { crew_id: null },
    headers: { 'Prefer': 'return=representation' },
    accessToken: session?.access_token,
  });
}

// Get tours for a crew
export async function getCrewTours(crewId: string) {
  const session = await getStoredSession();

  return supabaseRequest<Array<{
    id: string;
    name: string;
    artist: string;
    start_date: string;
    end_date: string;
    status: string;
  }>>(`/rest/v1/tours?crew_id=eq.${crewId}&select=id,name,artist,start_date,end_date,status&order=start_date.desc`, {
    accessToken: session?.access_token,
  });
}
