
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
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: "admin" | "sdr" | "growth";
          avatar: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: "admin" | "sdr" | "growth";
          avatar?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: "admin" | "sdr" | "growth";
          avatar?: string | null;
          created_at?: string;
        };
      };
      missions: {
        Row: {
          id: string;
          name: string;
          client: string;
          description: string | null;
          sdr_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          client: string;
          description?: string | null;
          sdr_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          client?: string;
          description?: string | null;
          sdr_id?: string;
          created_at?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          title: string;
          type: "email" | "database" | "linkedin";
          mission_id: string;
          created_by: string;
          created_at: string;
          status: "pending" | "inprogress" | "completed";
          due_date: string;
          is_late: boolean;
          last_updated: string;
        };
        Insert: {
          id?: string;
          title: string;
          type: "email" | "database" | "linkedin";
          mission_id: string;
          created_by: string;
          created_at?: string;
          status?: "pending" | "inprogress" | "completed";
          due_date: string;
          is_late?: boolean;
          last_updated?: string;
        };
        Update: {
          id?: string;
          title?: string;
          type?: "email" | "database" | "linkedin";
          mission_id?: string;
          created_by?: string;
          created_at?: string;
          status?: "pending" | "inprogress" | "completed";
          due_date?: string;
          is_late?: boolean;
          last_updated?: string;
        };
      };
      email_requests: {
        Row: {
          id: string;
          request_id: string;
          template: string;
          database: string;
          blacklist: string | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          template: string;
          database: string;
          blacklist?: string | null;
        };
        Update: {
          id?: string;
          request_id?: string;
          template?: string;
          database?: string;
          blacklist?: string | null;
        };
      };
      database_requests: {
        Row: {
          id: string;
          request_id: string;
          tool: string;
          targeting: string;
          blacklist: string | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          tool: string;
          targeting: string;
          blacklist?: string | null;
        };
        Update: {
          id?: string;
          request_id?: string;
          tool?: string;
          targeting?: string;
          blacklist?: string | null;
        };
      };
      linkedin_requests: {
        Row: {
          id: string;
          request_id: string;
          targeting: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          targeting: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          targeting?: string;
        };
      };
      databases: {
        Row: {
          id: string;
          name: string;
          file_url: string;
          uploaded_by: string;
          created_at: string;
          size: number;
          rows_count: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          file_url: string;
          uploaded_by: string;
          created_at?: string;
          size: number;
          rows_count?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          file_url?: string;
          uploaded_by?: string;
          created_at?: string;
          size?: number;
          rows_count?: number | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
