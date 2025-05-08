export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      acelle_accounts: {
        Row: {
          api_endpoint: string
          api_token: string
          cache_last_updated: string | null
          cache_priority: number | null
          created_at: string
          id: string
          last_sync_date: string | null
          last_sync_error: string | null
          mission_id: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          api_endpoint: string
          api_token: string
          cache_last_updated?: string | null
          cache_priority?: number | null
          created_at?: string
          id?: string
          last_sync_date?: string | null
          last_sync_error?: string | null
          mission_id?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          api_token?: string
          cache_last_updated?: string | null
          cache_priority?: number | null
          created_at?: string
          id?: string
          last_sync_date?: string | null
          last_sync_error?: string | null
          mission_id?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acelle_accounts_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      acelle_sync_logs: {
        Row: {
          account_id: string | null
          campaign_uid: string | null
          created_at: string
          details: Json | null
          id: string
          operation: string
        }
        Insert: {
          account_id?: string | null
          campaign_uid?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          operation: string
        }
        Update: {
          account_id?: string | null
          campaign_uid?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          operation?: string
        }
        Relationships: []
      }
      campaign_stats_cache: {
        Row: {
          account_id: string
          campaign_uid: string
          id: string
          last_updated: string
          statistics: Json
        }
        Insert: {
          account_id: string
          campaign_uid: string
          id?: string
          last_updated?: string
          statistics: Json
        }
        Update: {
          account_id?: string
          campaign_uid?: string
          id?: string
          last_updated?: string
          statistics?: Json
        }
        Relationships: []
      }
      database_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          name: string
          uploaded_by: string | null
          uploader_name: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          name: string
          uploaded_by?: string | null
          uploader_name?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          name?: string
          uploaded_by?: string | null
          uploader_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "database_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns_cache: {
        Row: {
          account_id: string
          cache_updated_at: string
          campaign_uid: string
          created_at: string
          delivery_date: string | null
          delivery_info: Json | null
          id: string
          last_error: string | null
          name: string
          run_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          account_id: string
          cache_updated_at?: string
          campaign_uid: string
          created_at: string
          delivery_date?: string | null
          delivery_info?: Json | null
          id?: string
          last_error?: string | null
          name: string
          run_at?: string | null
          status: string
          subject: string
          updated_at: string
        }
        Update: {
          account_id?: string
          cache_updated_at?: string
          campaign_uid?: string
          created_at?: string
          delivery_date?: string | null
          delivery_info?: Json | null
          id?: string
          last_error?: string | null
          name?: string
          run_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_cache_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "acelle_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          client: string
          created_at: string
          description: string | null
          end_date: string | null
          growth_id: string | null
          id: string
          name: string
          sdr_id: string | null
          start_date: string | null
          status: string
          type: string | null
          updated_at: string
        }
        Insert: {
          client: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          growth_id?: string | null
          id?: string
          name: string
          sdr_id?: string | null
          start_date?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          client?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          growth_id?: string | null
          id?: string
          name?: string
          sdr_id?: string | null
          start_date?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_growth_id_fkey"
            columns: ["growth_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          details: Json
          due_date: string
          id: string
          last_updated: string
          mission_id: string | null
          status: string
          target_role: string | null
          title: string
          type: string
          updated_at: string | null
          workflow_status: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          due_date?: string
          id?: string
          last_updated?: string
          mission_id?: string | null
          status?: string
          target_role?: string | null
          title: string
          type: string
          updated_at?: string | null
          workflow_status?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          due_date?: string
          id?: string
          last_updated?: string
          mission_id?: string | null
          status?: string
          target_role?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_relations: {
        Row: {
          created_at: string
          id: string
          manager_id: string
          member_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_id: string
          member_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_relations_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_relations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      email_campaigns_stats: {
        Row: {
          account_id: string | null
          avg_click_rate: number | null
          avg_open_rate: number | null
          campaign_count: number | null
          total_bounced: number | null
          total_clicked: number | null
          total_emails: number | null
          total_opened: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_cache_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "acelle_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_requests_view: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string | null
          created_by: string | null
          details: Json | null
          due_date: string | null
          id: string | null
          last_updated: string | null
          mission_client: string | null
          mission_id: string | null
          mission_name: string | null
          sdr_name: string | null
          status: string | null
          target_role: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          workflow_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      requests_with_missions: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string | null
          created_by: string | null
          details: Json | null
          due_date: string | null
          id: string | null
          last_updated: string | null
          mission_client: string | null
          mission_id: string | null
          mission_name: string | null
          sdr_name: string | null
          status: string | null
          target_role: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          workflow_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_user_profile: {
        Args: {
          user_id: string
          user_email: string
          user_name: string
          user_role: string
          user_avatar: string
        }
        Returns: Json
      }
      force_update_campaign_stats: {
        Args: { account_id_param: string }
        Returns: Json
      }
      update_acelle_campaign_stats: {
        Args: { account_id_param: string }
        Returns: Json
      }
      user_has_admin_or_growth_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_growth_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
