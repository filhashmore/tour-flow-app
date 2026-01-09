-- Tour Flow Database Schema for Supabase
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase Auth users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Crew',
  preferred_console TEXT,
  preferred_mics TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TOURS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  artist TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  notes TEXT,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TOUR MEMBERS TABLE (junction for users-tours)
-- ============================================
CREATE TABLE IF NOT EXISTS tour_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'crew' CHECK (role IN ('admin', 'crew')),
  can_view_financials BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tour_id, user_id)
);

-- ============================================
-- SHOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'USA',
  date DATE NOT NULL,
  load_in TIME,
  soundcheck TIME,
  doors TIME,
  show_time TIME,
  curfew TIME,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  venue_contact TEXT,
  venue_phone TEXT,
  venue_email TEXT,
  capacity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SETTLEMENTS TABLE (financial data - admin only)
-- ============================================
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE UNIQUE,
  guarantee DECIMAL(10,2) DEFAULT 0,
  bonus DECIMAL(10,2) DEFAULT 0,
  merch DECIMAL(10,2) DEFAULT 0,
  expenses DECIMAL(10,2) DEFAULT 0,
  per_diem DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'crew' CHECK (role IN ('admin', 'crew')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- ============================================
-- GEAR TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gear (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID REFERENCES tours(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  pack_number TEXT,
  height DECIMAL(10,2),
  width DECIMAL(10,2),
  length DECIMAL(10,2),
  weight DECIMAL(10,2),
  location TEXT,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'needs_repair')),
  notes TEXT,
  fly_pack BOOLEAN DEFAULT FALSE,
  serial_number TEXT,
  last_maintenance DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID REFERENCES tours(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- TOURS: Users can only see tours they're members of
CREATE POLICY "Users can view tours they are members of" ON tours
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid())
    OR admin_id = auth.uid()
  );

CREATE POLICY "Admins can create tours" ON tours
  FOR INSERT TO authenticated WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can update their tours" ON tours
  FOR UPDATE TO authenticated
  USING (
    admin_id = auth.uid() OR
    id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete their tours" ON tours
  FOR DELETE TO authenticated
  USING (admin_id = auth.uid());

-- TOUR MEMBERS: Users can see members of tours they belong to
CREATE POLICY "Users can view members of their tours" ON tour_members
  FOR SELECT TO authenticated
  USING (
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can add tour members" ON tour_members
  FOR INSERT TO authenticated
  WITH CHECK (
    tour_id IN (
      SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin'
    ) OR
    tour_id IN (SELECT id FROM tours WHERE admin_id = auth.uid())
  );

CREATE POLICY "Admins can update tour members" ON tour_members
  FOR UPDATE TO authenticated
  USING (
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can remove tour members" ON tour_members
  FOR DELETE TO authenticated
  USING (
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- SHOWS: Users can see shows for tours they belong to
CREATE POLICY "Users can view shows of their tours" ON shows
  FOR SELECT TO authenticated
  USING (
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage shows" ON shows
  FOR ALL TO authenticated
  USING (
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- SETTLEMENTS: Only users with financial access can view
CREATE POLICY "Users with financial access can view settlements" ON settlements
  FOR SELECT TO authenticated
  USING (
    show_id IN (
      SELECT s.id FROM shows s
      JOIN tour_members tm ON s.tour_id = tm.tour_id
      WHERE tm.user_id = auth.uid() AND (tm.role = 'admin' OR tm.can_view_financials = true)
    )
  );

CREATE POLICY "Admins can manage settlements" ON settlements
  FOR ALL TO authenticated
  USING (
    show_id IN (
      SELECT s.id FROM shows s
      JOIN tour_members tm ON s.tour_id = tm.tour_id
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  );

-- INVITATIONS: Users can see their own invitations, admins can manage tour invitations
CREATE POLICY "Users can view invitations sent to them" ON invitations
  FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin')
    OR tour_id IN (SELECT id FROM tours WHERE admin_id = auth.uid())
  );

CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE TO authenticated
  USING (
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin')
    OR email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- GEAR: Users can view gear for tours they belong to
CREATE POLICY "Users can view gear of their tours" ON gear
  FOR SELECT TO authenticated
  USING (
    tour_id IS NULL OR
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage gear" ON gear
  FOR ALL TO authenticated
  USING (
    tour_id IS NULL OR
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- DOCUMENTS: Users can view documents for tours they belong to
CREATE POLICY "Users can view documents of their tours" ON documents
  FOR SELECT TO authenticated
  USING (
    tour_id IS NULL OR
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage documents" ON documents
  FOR ALL TO authenticated
  USING (
    tour_id IS NULL OR
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- TASKS: Users can view tasks for tours they belong to
CREATE POLICY "Users can view tasks of their tours" ON tasks
  FOR SELECT TO authenticated
  USING (
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid())
    OR assignee_id = auth.uid()
  );

CREATE POLICY "Admins can manage tasks" ON tasks
  FOR ALL TO authenticated
  USING (
    tour_id IN (SELECT tour_id FROM tour_members WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their assigned tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (assignee_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-accept pending invitations when user signs up
CREATE OR REPLACE FUNCTION public.handle_pending_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Add user to tours they were invited to
  INSERT INTO tour_members (tour_id, user_id, role)
  SELECT tour_id, NEW.id, role
  FROM invitations
  WHERE email = NEW.email AND status = 'pending';

  -- Mark invitations as accepted
  UPDATE invitations
  SET status = 'accepted'
  WHERE email = NEW.email AND status = 'pending';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_accept_invitations
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_pending_invitations();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_gear_updated_at BEFORE UPDATE ON gear
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Note: Run this AFTER a user has signed up to create sample tours
-- Replace 'YOUR_USER_ID' with the actual user ID from the profiles table

-- To insert sample data, uncomment and run:
/*
INSERT INTO tours (name, artist, start_date, end_date, status, admin_id) VALUES
  ('Summer Festival Tour 2025', 'The Midnight Syndicate', '2025-06-01', '2025-08-31', 'upcoming', 'YOUR_USER_ID'),
  ('Fall Theater Run', 'Jazz Collective', '2025-09-15', '2025-11-30', 'upcoming', 'YOUR_USER_ID');
*/

-- ============================================
-- CREWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREW MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crew_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  job_title TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(crew_id, user_id)
);

-- ============================================
-- CREW INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crew_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  job_title TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- ============================================
-- CREW DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crew_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add crew_id to tours table
ALTER TABLE tours ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES crews(id) ON DELETE SET NULL;

-- ============================================
-- CREW RLS POLICIES
-- ============================================
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_documents ENABLE ROW LEVEL SECURITY;

-- CREWS: Users can only see crews they're members of
CREATE POLICY "Users can view crews they are members of" ON crews
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid())
    OR admin_id = auth.uid()
  );

CREATE POLICY "Users can create crews" ON crews
  FOR INSERT TO authenticated WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can update their crews" ON crews
  FOR UPDATE TO authenticated
  USING (
    admin_id = auth.uid() OR
    id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete their crews" ON crews
  FOR DELETE TO authenticated
  USING (admin_id = auth.uid());

-- CREW MEMBERS: Users can see members of crews they belong to
CREATE POLICY "Users can view members of their crews" ON crew_members
  FOR SELECT TO authenticated
  USING (
    crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can add crew members" ON crew_members
  FOR INSERT TO authenticated
  WITH CHECK (
    crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid() AND role = 'admin')
    OR crew_id IN (SELECT id FROM crews WHERE admin_id = auth.uid())
  );

CREATE POLICY "Admins can update crew members" ON crew_members
  FOR UPDATE TO authenticated
  USING (
    crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can remove crew members" ON crew_members
  FOR DELETE TO authenticated
  USING (
    crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- CREW INVITATIONS
CREATE POLICY "Users can view crew invitations sent to them" ON crew_invitations
  FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create crew invitations" ON crew_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid() AND role = 'admin')
    OR crew_id IN (SELECT id FROM crews WHERE admin_id = auth.uid())
  );

CREATE POLICY "Users can update crew invitations" ON crew_invitations
  FOR UPDATE TO authenticated
  USING (
    crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid() AND role = 'admin')
    OR email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- CREW DOCUMENTS
CREATE POLICY "Users can view documents of their crews" ON crew_documents
  FOR SELECT TO authenticated
  USING (
    crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage crew documents" ON crew_documents
  FOR ALL TO authenticated
  USING (
    crew_id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Crew document triggers
CREATE TRIGGER update_crews_updated_at BEFORE UPDATE ON crews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crew_documents_updated_at BEFORE UPDATE ON crew_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tour_members_user_id ON tour_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_members_tour_id ON tour_members(tour_id);
CREATE INDEX IF NOT EXISTS idx_shows_tour_id ON shows(tour_id);
CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(date);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_tour_id ON invitations(tour_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tour_id ON tasks(tour_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_gear_tour_id ON gear(tour_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_user_id ON crew_members(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_crew_id ON crew_members(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_invitations_email ON crew_invitations(email);
CREATE INDEX IF NOT EXISTS idx_tours_crew_id ON tours(crew_id);
