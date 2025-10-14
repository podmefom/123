export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'photographer' | 'designer' | 'admin';
          department: string | null;
          position: string | null;
          salary: number | null;
          phone: string | null;
          telegram: string | null;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: 'photographer' | 'designer' | 'admin';
          department?: string | null;
          position?: string | null;
          salary?: number | null;
          phone?: string | null;
          telegram?: string | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'photographer' | 'designer' | 'admin';
          department?: string | null;
          position?: string | null;
          salary?: number | null;
          phone?: string | null;
          telegram?: string | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          album_type: string;
          description: string | null;
          status: 'planning' | 'in-progress' | 'review' | 'completed';
          manager_id: string | null;
          deadline: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          album_type: string;
          description?: string | null;
          status?: 'planning' | 'in-progress' | 'review' | 'completed';
          manager_id?: string | null;
          deadline: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          album_type?: string;
          description?: string | null;
          status?: 'planning' | 'in-progress' | 'review' | 'completed';
          manager_id?: string | null;
          deadline?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: 'photographer' | 'designer';
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role: 'photographer' | 'designer';
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: 'photographer' | 'designer';
          created_at?: string;
        };
      };
      project_files: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          file_type: string;
          file_size: number;
          preview_url: string | null;
          file_url: string;
          uploaded_by: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          file_type: string;
          file_size: number;
          preview_url?: string | null;
          file_url: string;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          file_type?: string;
          file_size?: number;
          preview_url?: string | null;
          file_url?: string;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          event_time: string;
          event_type: 'meeting' | 'photoshoot' | 'design' | 'deadline' | 'other';
          created_by: string | null;
          project_id: string | null;
          is_note: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          event_time: string;
          event_type?: 'meeting' | 'photoshoot' | 'design' | 'deadline' | 'other';
          created_by?: string | null;
          project_id?: string | null;
          is_note?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string;
          event_type?: 'meeting' | 'photoshoot' | 'design' | 'deadline' | 'other';
          created_by?: string | null;
          project_id?: string | null;
          is_note?: boolean;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          project_id: string;
          author_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          author_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          author_id?: string | null;
          content?: string;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          title: string;
          report_type: 'project_summary' | 'employee_performance' | 'financial' | 'time_tracking' | 'custom';
          description: string | null;
          created_by: string;
          project_id: string | null;
          start_date: string | null;
          end_date: string | null;
          data: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          report_type: 'project_summary' | 'employee_performance' | 'financial' | 'time_tracking' | 'custom';
          description?: string | null;
          created_by: string;
          project_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          data?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          report_type?: 'project_summary' | 'employee_performance' | 'financial' | 'time_tracking' | 'custom';
          description?: string | null;
          created_by?: string;
          project_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          data?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      salary_calculations: {
        Row: {
          id: string;
          employee_id: string;
          project_type: 'individual' | 'kindergarten' | 'collective_11' | 'collective_9' | 'collective_4';
          info_collection_percent: number;
          photos_processed: boolean;
          revisions_approved: boolean;
          magazines_printed: boolean;
          deadlines_met: boolean;
          kr_magazines: number;
          calculated_salary: number;
          payment_stages: any;
          month: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          project_type: 'individual' | 'kindergarten' | 'collective_11' | 'collective_9' | 'collective_4';
          info_collection_percent?: number;
          photos_processed?: boolean;
          revisions_approved?: boolean;
          magazines_printed?: boolean;
          deadlines_met?: boolean;
          kr_magazines?: number;
          calculated_salary: number;
          payment_stages: any;
          month: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          project_type?: 'individual' | 'kindergarten' | 'collective_11' | 'collective_9' | 'collective_4';
          info_collection_percent?: number;
          photos_processed?: boolean;
          revisions_approved?: boolean;
          magazines_printed?: boolean;
          deadlines_met?: boolean;
          kr_magazines?: number;
          calculated_salary?: number;
          payment_stages?: any;
          month?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_participants: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          joined_at: string;
          unread_count: number;
        };
        Insert: {
          id?: string;
          chat_id: string;
          user_id: string;
          joined_at?: string;
          unread_count?: number;
        };
        Update: {
          id?: string;
          chat_id?: string;
          user_id?: string;
          joined_at?: string;
          unread_count?: number;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string | null;
          file_name: string | null;
          file_type: string | null;
          file_size: number | null;
          file_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          content?: string | null;
          file_name?: string | null;
          file_type?: string | null;
          file_size?: number | null;
          file_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          content?: string | null;
          file_name?: string | null;
          file_type?: string | null;
          file_size?: number | null;
          file_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
}