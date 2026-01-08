// Database types for Supabase
// These types match the schema defined in the Supabase dashboard

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: string | null;
          preferred_console: string | null;
          preferred_mics: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: string | null;
          preferred_console?: string | null;
          preferred_mics?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: string | null;
          preferred_console?: string | null;
          preferred_mics?: string[] | null;
          updated_at?: string;
        };
      };
      tours: {
        Row: {
          id: string;
          name: string;
          artist: string;
          start_date: string;
          end_date: string;
          status: 'upcoming' | 'active' | 'completed';
          notes: string | null;
          admin_id: string;
          crew_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          artist: string;
          start_date: string;
          end_date: string;
          status?: 'upcoming' | 'active' | 'completed';
          notes?: string | null;
          admin_id: string;
          crew_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          artist?: string;
          start_date?: string;
          end_date?: string;
          status?: 'upcoming' | 'active' | 'completed';
          notes?: string | null;
          crew_id?: string | null;
          updated_at?: string;
        };
      };
      tour_members: {
        Row: {
          id: string;
          tour_id: string;
          user_id: string;
          role: 'admin' | 'crew';
          can_view_financials: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tour_id: string;
          user_id: string;
          role?: 'admin' | 'crew';
          can_view_financials?: boolean;
          created_at?: string;
        };
        Update: {
          role?: 'admin' | 'crew';
          can_view_financials?: boolean;
        };
      };
      shows: {
        Row: {
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
          status: 'confirmed' | 'pending' | 'cancelled';
          venue_contact: string | null;
          venue_phone: string | null;
          venue_email: string | null;
          capacity: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tour_id: string;
          venue: string;
          city: string;
          state: string;
          country: string;
          date: string;
          load_in?: string | null;
          soundcheck?: string | null;
          doors?: string | null;
          show_time?: string | null;
          curfew?: string | null;
          status?: 'confirmed' | 'pending' | 'cancelled';
          venue_contact?: string | null;
          venue_phone?: string | null;
          venue_email?: string | null;
          capacity?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          venue?: string;
          city?: string;
          state?: string;
          country?: string;
          date?: string;
          load_in?: string | null;
          soundcheck?: string | null;
          doors?: string | null;
          show_time?: string | null;
          curfew?: string | null;
          status?: 'confirmed' | 'pending' | 'cancelled';
          venue_contact?: string | null;
          venue_phone?: string | null;
          venue_email?: string | null;
          capacity?: number | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      settlements: {
        Row: {
          id: string;
          show_id: string;
          guarantee: number;
          bonus: number;
          merch: number;
          expenses: number;
          per_diem: number;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          show_id: string;
          guarantee?: number;
          bonus?: number;
          merch?: number;
          expenses?: number;
          per_diem?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          guarantee?: number;
          bonus?: number;
          merch?: number;
          expenses?: number;
          per_diem?: number;
          total?: number;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          email: string;
          tour_id: string;
          role: 'admin' | 'crew';
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          tour_id: string;
          role?: 'admin' | 'crew';
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'declined';
        };
      };
      gear: {
        Row: {
          id: string;
          tour_id: string | null;
          name: string;
          category: string;
          pack_number: string | null;
          height: number | null;
          width: number | null;
          length: number | null;
          weight: number | null;
          location: string | null;
          condition: string | null;
          notes: string | null;
          fly_pack: boolean;
          serial_number: string | null;
          last_maintenance: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tour_id?: string | null;
          name: string;
          category: string;
          pack_number?: string | null;
          height?: number | null;
          width?: number | null;
          length?: number | null;
          weight?: number | null;
          location?: string | null;
          condition?: string | null;
          notes?: string | null;
          fly_pack?: boolean;
          serial_number?: string | null;
          last_maintenance?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tour_id?: string | null;
          name?: string;
          category?: string;
          pack_number?: string | null;
          height?: number | null;
          width?: number | null;
          length?: number | null;
          weight?: number | null;
          location?: string | null;
          condition?: string | null;
          notes?: string | null;
          fly_pack?: boolean;
          serial_number?: string | null;
          last_maintenance?: string | null;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          tour_id: string | null;
          name: string;
          type: string;
          content: string | null;
          file_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tour_id?: string | null;
          name: string;
          type: string;
          content?: string | null;
          file_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tour_id?: string | null;
          name?: string;
          type?: string;
          content?: string | null;
          file_url?: string | null;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          tour_id: string | null;
          show_id: string | null;
          title: string;
          description: string | null;
          assignee_id: string | null;
          due_date: string | null;
          status: 'pending' | 'in_progress' | 'completed';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tour_id?: string | null;
          show_id?: string | null;
          title: string;
          description?: string | null;
          assignee_id?: string | null;
          due_date?: string | null;
          status?: 'pending' | 'in_progress' | 'completed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tour_id?: string | null;
          show_id?: string | null;
          title?: string;
          description?: string | null;
          assignee_id?: string | null;
          due_date?: string | null;
          status?: 'pending' | 'in_progress' | 'completed';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      tour_status: 'upcoming' | 'active' | 'completed';
      show_status: 'confirmed' | 'pending' | 'cancelled';
      member_role: 'admin' | 'crew';
      invitation_status: 'pending' | 'accepted' | 'declined';
      task_status: 'pending' | 'in_progress' | 'completed';
      task_priority: 'low' | 'medium' | 'high' | 'urgent';
    };
  };
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Tour = Database['public']['Tables']['tours']['Row'];
export type TourMember = Database['public']['Tables']['tour_members']['Row'];
export type Show = Database['public']['Tables']['shows']['Row'];
export type Settlement = Database['public']['Tables']['settlements']['Row'];
export type Invitation = Database['public']['Tables']['invitations']['Row'];
export type Gear = Database['public']['Tables']['gear']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
