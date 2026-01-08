# Tour Flow v1.9.0

Professional tour management app for touring audio engineers. Built to match Master Tour Mobile and Crewik exactly.

## New in v1.9.0: Crew-Tour Assignment System

### How Crew-Tour Visibility Works
The key principle: **Joining a crew gives you POTENTIAL access. Only tours explicitly assigned to that crew become visible.**

### Changes from v1.8.0
- **Tours are now assigned TO crews** (not the other way around)
- Crew members only see tours that have been explicitly assigned to their crew
- When a user accepts a crew invitation, they do NOT automatically see all tours
- Admins must explicitly assign a crew to a tour for members to see it

### User Experience Flow
1. **Admin creates crew** - Invites members via email
2. **Members accept invitation** - They become crew members but see no tours yet
3. **Admin creates tour** - During tour creation, admin can assign a crew
4. **Crew members now see the tour** - Only tours with their crew assigned are visible
5. **Admin assigns crew to more tours** - Members see those tours too

### Tour Creation/Edit
- New **"Assign to Crew"** dropdown in Add Tour and Edit Tour modals
- Shows only crews where user is admin
- Optional selection - tours without crew assignment work as before
- Helper text: "Only crew members will be able to see this tour"

### Technical Implementation
- `tours.crew_id` field links tours to crews
- `getUserTours()` now includes `crew_id` in query
- `linkTourToCrew()` and `unlinkTourFromCrew()` API functions
- Store's Tour interface includes optional `crewId` field
- TourMembership type includes `crew_id` for filtering

## New in v1.8.0: Crew Management System

### What is a Crew?
A **Crew** represents a band/artist and their core team. Each crew has its own:
- Members (admins and regular members)
- Documents (riders, input lists, stage plots, tech specs)
- Associated tours

### Features
- **Create Crews** - Create a crew for each band/artist you work with
- **Invite Members** - Add team members via email with admin or member roles
- **Crew Documents** - Shared access to riders, input lists, stage plots across all crew members
- **Link Tours to Crews** - Associate tours with specific crews for shared access
- **Multi-Crew Support** - Users can be members of multiple crews

### Permissions
- **Crew Creator** - Automatically becomes crew admin
- **Crew Admin** - Can add/remove members, manage documents, edit crew details
- **Crew Member** - Can view all crew data and documents

### Navigation
- New **Crews** tab in the bottom navigation
- Access crew details, members, documents, and linked tours
- Filter views by active crew

### Technical Implementation
- New Supabase tables: `crews`, `crew_members`, `crew_documents`, `crew_invitations`
- Store updated with crew state management
- Auth context syncs crew memberships like tour memberships
- Real-time crew data sync on login

## New in v1.7.1: Cross-Tab Show Sync

### Bug Fix
- **Shows now sync across all tabs** - Shows created in Events tab now appear in Dates tab immediately
- **Calendar view shows all tours** - Monthly calendar modal now displays dates from ALL tours, not just the active tour
- **Unified show data** - Both Events and Dates tabs now pull shows from all tours the user has access to

### Technical Changes
- Added `calendarShows` memo in calendar.tsx that aggregates shows from all tours
- Updated CalendarViewModal to receive shows from all tours with tourId tracking
- Fixed onSelectDate handler to navigate correctly to shows from any tour

## New in v1.7.0: Multi-Tenant User Isolation

### Critical Security Fix
- **User data isolation** - Users can ONLY see tours they are members of
- Tours are now synced from Supabase based on user's `tour_members` entries
- Local storage NO LONGER stores tour data - prevents data leakage between users
- Data clears automatically when user logs out or switches accounts

### How It Works
1. **New user signs up** → Sees empty state (no tours)
2. **User creates tour** → Automatically becomes admin of that tour via Supabase
3. **User invited to tour** → Tour appears after accepting invitation
4. **User logs out** → All local data is cleared

### Technical Changes
- Store now tracks `currentUserId` to detect user changes
- `refreshTourMemberships()` syncs tours from Supabase to store
- `clearUserData()` called on sign out
- Version bumped to v1.7.0 to clear any leaked data from previous versions
- Tours, shows, gear, documents, tasks are NOT loaded from local storage

## New in v1.6.2: Tour Selection for Shows

### Add Shows from Any Screen
- **Tour selector dropdown** in Add Date (Dates tab) and Add Event (Events tab) modals
- Select which tour to add the show to from a dropdown of tours you're admin of
- Default tour pre-selected based on active tour
- Empty state when no tours available with helpful message
- Works in both online (Supabase) and offline modes

### Add Show from Tour Detail
- **Add Show button** in tour detail view (emerald plus icon)
- Empty state shows "Add First Show" prompt when tour has no shows
- Full show creation form with:
  - Venue name (required)
  - City & State
  - Show date (YYYY-MM-DD format)
  - Schedule times: Load In, Soundcheck, Doors, Show Time, Curfew
  - Venue capacity
  - Notes
- Shows automatically added to tour with confirmed status
- Haptic feedback on successful creation

## New in v1.6.0: Clean Start Experience

### Empty App by Default
- **No sample/test data** - app starts completely empty
- New users see welcome screen: "No tours yet—create one or wait for invite"
- Data only appears after user creates tours or accepts invitations
- No legacy data loads on startup
- **Version-based cache clear** - automatically clears old sample data from previous versions

### Removed Features
- **Reset Data button removed** - no user access to data reset
- Sample data loading removed from app initialization
- All hardcoded tour/show/gear data removed from codebase

### Clean User Flow
1. Sign up / Log in → Empty dashboard with welcome message
2. Create tour → Become admin automatically
3. Or wait for invitation → Accept to join tour
4. Real-time sync ensures no stale data

### Files Modified for Clean Start
- `src/lib/sampleData.ts` - Cleared all sample data
- `src/lib/store.ts` - Added version check to clear old cached data
- `src/app/(tabs)/schedule.tsx` - Removed hardcoded TRAVEL_INFO
- `src/app/(tabs)/_layout.tsx` - Removed sample data loading
- `src/app/(tabs)/more.tsx` - Removed Reset Data button

## New in v1.5.0: Band Data Upload & Multi-Crew Support

### Upload Band Data (Admin)
- **Upload button** (purple) in Crew tab header for admins
- Support for images (photos of riders) and documents (PDF/text)
- Three upload categories:
  - **Technical Rider**: FOH specs, monitor requirements (27Hz-20kHz, 110dB, IEM only)
  - **Input List**: Channel assignments, mic selections (Kick In Beta 91A, etc.)
  - **Gear List**: Equipment inventory with categories and conditions
- Two-step flow: Upload files → Review parsed data → Apply to tour
- Parsed data auto-populates input list and gear inventory

### Multi-Crew/Tour Filter
- **Tour filter** in Crew tab to filter crew by tour
- "All Crews" option pools data from all tours
- Horizontal scrollable filter chips

## New in v1.4.0: Admin Tools & UX Improvements

### Tour Editing (Admin)
- **Edit button** on tour details for admins (pencil icon in tour header)
- Modify tour name, artist, dates, status, and notes
- Status toggle: Upcoming / Active / Completed
- Changes save instantly with haptic feedback

### Events Tab Improvements
- **KeyboardAvoidingView** for better mobile keyboard handling
- Notes input now expandable and scrollable (120px-200px height)
- Improved scrolling behavior with `keyboardShouldPersistTaps`

### Empty App State for New Users
- New users see welcome screen instead of empty dashboard
- "Create Your First Tour" button for quick onboarding
- Message explains waiting for invite vs creating own tour
- Creating a tour makes you admin automatically

### Remove Crew Member (Admin)
- **Remove Member** button in expanded crew card
- Only visible to admin users
- Haptic feedback on removal

### Editable Schedule
- Full edit modal for schedule times
- Modify Load In, Soundcheck, Doors, Show, Curfew times
- Add notes to any show
- Pencil icon appears on editable timeline items

### Share Schedule
- **Share button** (blue) in Schedule header
- Native share sheet for sharing schedule text
- Copy to clipboard button preserved
- Public link generation (view-only URL)

## New in v1.3.0: Multi-User Invitation & Sync

### Enhanced Crew Invitation
- **Invite to Tour button** in Crew tab for admins
- Email input with role selection (Admin/Crew)
- **Can View Financials** toggle for crew members
- If user exists: Immediately added to tour
- If user doesn't exist: Invitation stored, auto-added on sign-up
- Console logs for invite/sync operations (view in LOGS tab)

### Invited User Flow
- On sign-up/login, pending invitations appear on Dashboard
- One-tap "Join" button to accept tour invitation
- Tours appear automatically after accepting
- Role-based access enforced immediately

### Role-Based Permissions (Financials)
- **Admin**: Can view all financial data (settlements, totals)
- **Crew**: Financials hidden by default
- **Crew + Can View Financials**: See settlements if admin grants permission
- Hidden financials show "Financial information is hidden for your role" notice
- Tour list shows "Hidden" badge when financials are restricted

### Test Data
- New **Spring Test Tour 2026** with 2 shows (The Fillmore SF, The Troubadour LA)
- Clean settlement data for testing admin/crew permissions
- Use `loadCleanTestData()` for minimal test setup

## Testing Instructions

### As Admin:
1. Sign up / Log in
2. Go to Crew tab
3. Tap "Invite to Tour" button
4. Enter crew member email, select role
5. Send invitation
6. Check LOGS tab for invite confirmation

### As Invited User:
1. Sign up with invited email
2. Check Dashboard for pending invitation
3. Tap "Join" to accept
4. Verify tour appears in list
5. Check that financials are hidden (if crew role)

## New in v1.2.0: Multi-User Authentication & Collaboration

### Supabase Authentication
- Email + password sign-up/login
- Email verification required
- Password reset via email
- Persistent sessions across devices

### User Roles & Permissions
- **Admin**: Create/manage tours, invite crew, view financials, full edit access
- **Crew**: View assigned tours only, financials hidden unless permitted

### Crew Invitation System
- Admins can invite crew via email from Crew tab (blue button)
- If user exists: Immediately added to tour
- If user doesn't exist: Invitation email sent, auto-added on sign-up
- Users can be on multiple tours from different organizations

### Database Features
- Row Level Security (RLS) for data protection
- Users can only access tours they're members of
- Real-time sync ready
- GDPR-compliant (encrypted at rest)

## Setup Supabase (Required for Authentication)

1. Create a free Supabase project at https://supabase.com
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. In Vibecode, go to ENV tab and add:
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

Find these values in Supabase: Settings → API → Project URL and anon key

## Navigation (5 Tabs)

- **Dashboard** - Tour overview, next show, quick stats, tasks, stealth mode
- **Dates** - Vertical show list with Add Date, calendar view, contact actions
- **Schedule** - Day view timeline with edit functionality, calendar picker
- **Events** - Month-grouped show list with Add Event, multi-tour view
- **More** - Profile, Gear, Crew, Documents, AI, Settings (all functional)

## New in v1.1.0

### Role-Based Permissions
- **Admin Role**: Full edit access, view financials, manage all data
- **User Role**: View-only access, financials hidden
- Switch roles via Profile section in More tab

### Stealth Mode
- Double-tap Dashboard header to toggle
- Or use eye icon button
- Hides all financial data temporarily
- Amber badge indicator when active

### Enhanced Dashboard
- Clickable Active Tour tile (navigates to Tours)
- Clickable Next Show tile (navigates to show details)
- Clickable Quick Stats cards
- Editable Priority Tasks with modal
- Task priority cycling and delete
- Gear Alerts with navigation to Gear screen
- AI Quick Actions

### Enhanced Dates Tab
- Add Date button (admin only)
- Monthly calendar view modal with show dates highlighted
- Larger horizontal tiles
- Past dates grayed out (opacity 50%)
- Day Sheet generation button (opens AI assistant)
- Call/mail contact buttons functional

### Enhanced Schedule Tab
- Edit functionality via modal (admin only)
- Pencil icons on editable fields
- Show name tile clickable to Events
- Calendar picker modal for navigation
- Copy to clipboard functionality

### Enhanced Events Tab
- Add Event button (admin only)
- Multi-tour view with tour picker
- Filter by tour
- Past events with reduced opacity

### Enhanced More Tab
- All settings sections functional
- Notifications toggle with modal
- Appearance (Dark/Light/System) with modal
- Sync & Backup with last sync date and Sync Now button
- Offline Mode toggle with features list
- Help Center with topic list and email support
- About modal with version info
- Role switching modal

### Enhanced Crew Screen
- Credentials field display on cards
- Credentials section in expanded details
- Credentials input in Add Crew modal
- Blue badge styling for credentials

### Enhanced Gear Inventory
- "Need Attention" filter toggle
- Click tile to filter items needing repair
- Amber highlight when filter active
- Combines with other filters (category, fly pack)

### Enhanced AI Assistant
- Chat history persists via Zustand store
- Copy with visual feedback (check icon)
- Share button for each response
- Native share sheet integration
- Improved PDF-ready formatting

## UI/UX (Master Tour Match)

- Ultra-dark background (#0a0a0a)
- White text, subtle gray accents
- Emerald (#00d4aa) for confirmed/active states
- Amber (#f59e0b) for attention items
- Compact date circles (day + month)
- Plain list rows with right chevrons
- Thin horizontal dividers
- Calendar picker icons in headers
- Subtle tab highlighting

## Features

### Dates Tab
- Add Date button with full form
- Monthly calendar view
- Date circle with day/month
- Venue name, city, show time
- Status badges (CONFIRMED, PENDING, CANCELLED)
- Expandable timeline with contact actions
- Day Sheet button

### Schedule Tab
- Navigate between shows
- Edit times via modal
- Travel rows with distance/duration/timezone
- Timeline: Load In → Soundcheck → Dinner → Doors → Show → Curfew → Bus Call
- Copy Schedule button (clean text to clipboard)

### Events Tab
- Tour picker for multi-tour filtering
- Add Event modal
- Sticky month headers (January 2026, etc.)
- Compact event cards
- Date badge, venue, capacity

### More Menu
- Profile row with role badge and stealth indicator
- Active tour card (clickable)
- Plain list: Gear, Documents, Crew, AI Assistant, Maintenance
- Settings: Notifications, Appearance, Sync, Offline Mode
- Help Center and About
- Sign out at bottom

### AI Assistant (Flow AI)
- GPT-5.2 powered
- Day sheet generation (professional format, no code blocks)
- Venue advance sheets
- Input list parsing
- Mixing tips by PA system
- RF coordination
- Copy with visual feedback
- Share via native share sheet

## Sample Data

### Active Tour (2026)
**Tour:** Neon Horizons World Tour
**Artist:** The Wavelengths
**Dates:** January 15 - June 30, 2026

**12 Shows:**
- The Anthem (DC) - Jan 15
- Terminal 5 (NYC) - Jan 17
- House of Blues (Boston) - Jan 19
- The Fillmore (Philadelphia) - Jan 21
- The Ryman (Nashville) - Feb 5
- The Tabernacle (Atlanta) - Feb 7
- ACL Live (Austin) - Feb 14
- The Wiltern (LA) - Mar 1
- The Greek Theatre (LA) - Mar 3
- Bill Graham Civic (SF) - Mar 6
- Red Rocks (Morrison) - May 15
- Gorge Amphitheatre (George) - Jun 20

### Past Tour (for testing)
**Tour:** Summer Sounds 2025
**Artist:** The Wavelengths
**Status:** Completed

**3 Shows:**
- Irving Plaza (NYC) - Aug 15, 2025
- 9:30 Club (DC) - Aug 17, 2025
- Paradise Rock Club (Boston) - Aug 19, 2025

**Crew:** 4 members with credentials
- Marcus Chen (FOH Engineer) - AAA All Access
- Sarah Kim (Monitor Engineer) - Production Office
- Tony Rizzo (Stage Tech) - Stage Access
- Lisa Wong (Tour Manager) - AAA All Access, Production Office

**Gear:** 15 items (M32, DL32, mics, DIs, IEM, RF, backline)

**Input List:** 24 channels

## Tech Stack

- Expo SDK 53 / React Native 0.76.7
- NativeWind (TailwindCSS)
- Zustand + AsyncStorage (persistence)
- OpenAI API (GPT-5.2)
- lucide-react-native icons
- expo-haptics
- react-native-reanimated

## Colors

- Background: #0a0a0f
- Cards: #1a1a2e, #16213e
- Borders: white/5, white/10
- Text: #fff (primary), #9ca3af (secondary), #6b7280 (muted)
- Emerald: #00d4aa (active, success)
- Amber: #f59e0b (attention, warnings)
- Red: #ef4444 (error, delete)
- Blue: #3b82f6 (info, fly pack)
- Purple: #8b5cf6 (accent)
