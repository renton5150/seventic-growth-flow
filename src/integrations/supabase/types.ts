export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      cra_reminders: {
        Row: {
          email_sent: boolean
          id: string
          missing_date: string
          reminder_sent_at: string
          sdr_id: string
        }
        Insert: {
          email_sent?: boolean
          id?: string
          missing_date: string
          reminder_sent_at?: string
          sdr_id: string
        }
        Update: {
          email_sent?: boolean
          id?: string
          missing_date?: string
          reminder_sent_at?: string
          sdr_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cra_reminders_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activity_reports: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          is_completed: boolean
          report_date: string
          sdr_id: string
          total_percentage: number
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          report_date: string
          sdr_id: string
          total_percentage?: number
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          report_date?: string
          sdr_id?: string
          total_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_activity_reports_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_mission_time: {
        Row: {
          created_at: string
          id: string
          mission_comment: string | null
          mission_id: string
          report_id: string
          time_percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_comment?: string | null
          mission_id: string
          report_id: string
          time_percentage: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_comment?: string | null
          mission_id?: string
          report_id?: string
          time_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_mission_time_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_mission_time_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "cra_reports_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_mission_time_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_activity_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_opportunities: {
        Row: {
          created_at: string
          id: string
          mission_id: string
          opportunity_name: string
          opportunity_value: number
          report_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_id: string
          opportunity_name: string
          opportunity_value: number
          report_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_id?: string
          opportunity_name?: string
          opportunity_value?: number
          report_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_opportunities_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_opportunities_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "cra_reports_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_opportunities_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "daily_activity_reports"
            referencedColumns: ["id"]
          },
        ]
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
      domains: {
        Row: {
          created_at: string
          creation_date: string
          domain_name: string
          expiration_date: string
          hosting_provider: string | null
          id: string
          login: string
          mission_id: string | null
          password_encrypted: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creation_date: string
          domain_name: string
          expiration_date: string
          hosting_provider?: string | null
          id?: string
          login: string
          mission_id?: string | null
          password_encrypted: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creation_date?: string
          domain_name?: string
          expiration_date?: string
          hosting_provider?: string | null
          id?: string
          login?: string
          mission_id?: string | null
          password_encrypted?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
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
      email_campaigns_stats_table: {
        Row: {
          account_id: string
          avg_click_rate: number | null
          avg_open_rate: number | null
          campaign_count: number | null
          id: string
          total_bounced: number | null
          total_clicked: number | null
          total_emails: number | null
          total_opened: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          avg_click_rate?: number | null
          avg_open_rate?: number | null
          campaign_count?: number | null
          id?: string
          total_bounced?: number | null
          total_clicked?: number | null
          total_emails?: number | null
          total_opened?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          avg_click_rate?: number | null
          avg_open_rate?: number | null
          campaign_count?: number | null
          id?: string
          total_bounced?: number | null
          total_clicked?: number | null
          total_emails?: number | null
          total_opened?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_platform_account_front_offices: {
        Row: {
          account_id: string
          created_at: string
          front_office_id: string
          id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          front_office_id: string
          id?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          front_office_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_platform_account_front_offices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_platform_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_platform_account_front_offices_front_office_id_fkey"
            columns: ["front_office_id"]
            isOneToOne: false
            referencedRelation: "front_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      email_platform_accounts: {
        Row: {
          backup_email: string | null
          created_at: string
          created_by: string | null
          credit_card_last_four: string | null
          credit_card_name: string | null
          dedicated_ip: boolean
          dedicated_ip_address: unknown | null
          domain_hosting_provider: string | null
          domain_login: string | null
          domain_name: string | null
          domain_password: string | null
          id: string
          login: string
          mission_id: string
          password_encrypted: string
          phone_number: string | null
          platform_id: string
          routing_interfaces: string[]
          spf_dkim_status: string
          status: string
          updated_at: string
        }
        Insert: {
          backup_email?: string | null
          created_at?: string
          created_by?: string | null
          credit_card_last_four?: string | null
          credit_card_name?: string | null
          dedicated_ip?: boolean
          dedicated_ip_address?: unknown | null
          domain_hosting_provider?: string | null
          domain_login?: string | null
          domain_name?: string | null
          domain_password?: string | null
          id?: string
          login: string
          mission_id: string
          password_encrypted: string
          phone_number?: string | null
          platform_id: string
          routing_interfaces?: string[]
          spf_dkim_status?: string
          status?: string
          updated_at?: string
        }
        Update: {
          backup_email?: string | null
          created_at?: string
          created_by?: string | null
          credit_card_last_four?: string | null
          credit_card_name?: string | null
          dedicated_ip?: boolean
          dedicated_ip_address?: unknown | null
          domain_hosting_provider?: string | null
          domain_login?: string | null
          domain_name?: string | null
          domain_password?: string | null
          id?: string
          login?: string
          mission_id?: string
          password_encrypted?: string
          phone_number?: string | null
          platform_id?: string
          routing_interfaces?: string[]
          spf_dkim_status?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_platform_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_platform_accounts_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_platform_accounts_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "email_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      email_platforms: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      enriched_contacts: {
        Row: {
          civilite: string | null
          created_at: string
          email: string | null
          entreprise: string | null
          id: string
          id_hubspot: string | null
          imported_contact_id: string | null
          nom: string | null
          prenom: string | null
          processing_job_id: string
          status_enrichissement: string
        }
        Insert: {
          civilite?: string | null
          created_at?: string
          email?: string | null
          entreprise?: string | null
          id?: string
          id_hubspot?: string | null
          imported_contact_id?: string | null
          nom?: string | null
          prenom?: string | null
          processing_job_id: string
          status_enrichissement: string
        }
        Update: {
          civilite?: string | null
          created_at?: string
          email?: string | null
          entreprise?: string | null
          id?: string
          id_hubspot?: string | null
          imported_contact_id?: string | null
          nom?: string | null
          prenom?: string | null
          processing_job_id?: string
          status_enrichissement?: string
        }
        Relationships: [
          {
            foreignKeyName: "enriched_contacts_imported_contact_id_fkey"
            columns: ["imported_contact_id"]
            isOneToOne: false
            referencedRelation: "imported_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enriched_contacts_job"
            columns: ["processing_job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      front_offices: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      imported_contacts: {
        Row: {
          created_at: string
          email: string | null
          entreprise: string | null
          file_id: string
          id: string
          id_hubspot: string | null
          nom: string | null
          prenom: string | null
          processing_job_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          entreprise?: string | null
          file_id: string
          id?: string
          id_hubspot?: string | null
          nom?: string | null
          prenom?: string | null
          processing_job_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          entreprise?: string | null
          file_id?: string
          id?: string
          id_hubspot?: string | null
          nom?: string | null
          prenom?: string | null
          processing_job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_imported_contacts_job"
            columns: ["processing_job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_contacts_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          client: string
          created_at: string
          criteres_qualification: string | null
          description: string | null
          end_date: string | null
          growth_id: string | null
          id: string
          interlocuteurs_cibles: string | null
          login_connexion: string | null
          name: string
          objectif_mensuel_rdv: string | null
          sdr_id: string | null
          start_date: string | null
          status: string
          type: string | null
          types_prestation: Json | null
          updated_at: string
        }
        Insert: {
          client: string
          created_at?: string
          criteres_qualification?: string | null
          description?: string | null
          end_date?: string | null
          growth_id?: string | null
          id?: string
          interlocuteurs_cibles?: string | null
          login_connexion?: string | null
          name: string
          objectif_mensuel_rdv?: string | null
          sdr_id?: string | null
          start_date?: string | null
          status?: string
          type?: string | null
          types_prestation?: Json | null
          updated_at?: string
        }
        Update: {
          client?: string
          created_at?: string
          criteres_qualification?: string | null
          description?: string | null
          end_date?: string | null
          growth_id?: string | null
          id?: string
          interlocuteurs_cibles?: string | null
          login_connexion?: string | null
          name?: string
          objectif_mensuel_rdv?: string | null
          sdr_id?: string | null
          start_date?: string | null
          status?: string
          type?: string | null
          types_prestation?: Json | null
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
      processing_checkpoints: {
        Row: {
          checkpoint_data: Json
          created_at: string
          id: string
          processing_job_id: string
          updated_at: string
        }
        Insert: {
          checkpoint_data?: Json
          created_at?: string
          id?: string
          processing_job_id: string
          updated_at?: string
        }
        Update: {
          checkpoint_data?: Json
          created_at?: string
          id?: string
          processing_job_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_checkpoints_processing_job_id_fkey"
            columns: ["processing_job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          contacts_file_id: string | null
          created_at: string
          date_debut: string | null
          date_fin: string | null
          error_message: string | null
          id: string
          nombre_contacts_enrichis: number | null
          nombre_contacts_non_enrichis: number | null
          nombre_total_contacts: number | null
          point_reprise: Json | null
          reference_file_id: string | null
          status_traitement: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contacts_file_id?: string | null
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          error_message?: string | null
          id?: string
          nombre_contacts_enrichis?: number | null
          nombre_contacts_non_enrichis?: number | null
          nombre_total_contacts?: number | null
          point_reprise?: Json | null
          reference_file_id?: string | null
          status_traitement?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contacts_file_id?: string | null
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          error_message?: string | null
          id?: string
          nombre_contacts_enrichis?: number | null
          nombre_contacts_non_enrichis?: number | null
          nombre_total_contacts?: number | null
          point_reprise?: Json | null
          reference_file_id?: string | null
          status_traitement?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_contacts_file_id_fkey"
            columns: ["contacts_file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_jobs_reference_file_id_fkey"
            columns: ["reference_file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
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
      reference_firstnames: {
        Row: {
          civility_en: string | null
          civility_fr: string | null
          created_at: string
          file_id: string | null
          gender: string | null
          id: string
          name_first: string
          name_first_lowercase: string | null
          processing_job_id: string | null
        }
        Insert: {
          civility_en?: string | null
          civility_fr?: string | null
          created_at?: string
          file_id?: string | null
          gender?: string | null
          id?: string
          name_first?: string
          name_first_lowercase?: string | null
          processing_job_id?: string | null
        }
        Update: {
          civility_en?: string | null
          civility_fr?: string | null
          created_at?: string
          file_id?: string | null
          gender?: string | null
          id?: string
          name_first?: string
          name_first_lowercase?: string | null
          processing_job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_firstnames_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_firstnames_processing_job_id_fkey"
            columns: ["processing_job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
        ]
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
      uploaded_files: {
        Row: {
          file_name: string
          file_type: string
          id: string
          storage_path: string
          uploaded_at: string
          uploader_id: string | null
        }
        Insert: {
          file_name: string
          file_type: string
          id?: string
          storage_path: string
          uploaded_at?: string
          uploader_id?: string | null
        }
        Update: {
          file_name?: string
          file_type?: string
          id?: string
          storage_path?: string
          uploaded_at?: string
          uploader_id?: string | null
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          invitation_token: string
          is_used: boolean | null
          name: string
          role: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invitation_token: string
          is_used?: boolean | null
          name: string
          role: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string
          is_used?: boolean | null
          name?: string
          role?: string
          used_at?: string | null
        }
        Relationships: []
      }
      work_schedule_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedule_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "work_schedule_requests_old"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedule_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          is_exceptional: boolean
          reason: string | null
          request_type: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_exceptional?: boolean
          reason?: string | null
          request_type: string
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_exceptional?: boolean
          reason?: string | null
          request_type?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_schedule_requests_old: {
        Row: {
          admin_comment: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          is_exceptional: boolean
          reason: string | null
          request_type: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_comment?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_exceptional?: boolean
          reason?: string | null
          request_type: string
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_comment?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_exceptional?: boolean
          reason?: string | null
          request_type?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      cra_reports_with_details: {
        Row: {
          comments: string | null
          created_at: string | null
          id: string | null
          is_completed: boolean | null
          report_date: string | null
          sdr_email: string | null
          sdr_id: string | null
          sdr_name: string | null
          total_percentage: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_activity_reports_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      check_if_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      check_missing_cra_reports: {
        Args: Record<PropertyKey, never>
        Returns: {
          sdr_id: string
          sdr_name: string
          sdr_email: string
          missing_date: string
        }[]
      }
      create_checkpoint_table: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
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
      diagnose_campaign_statistics: {
        Args: { account_id_param: string }
        Returns: {
          data_source: string
          campaign_uid: string
          subscriber_count: string
          delivered_count: string
          open_count: string
          open_rate: string
          click_rate: string
          last_updated: string
        }[]
      }
      find_missing_campaign_references: {
        Args: { account_id_param: string }
        Returns: {
          campaign_uid: string
          table_name: string
        }[]
      }
      fix_campaign_statistics: {
        Args: { account_id_param: string; campaign_uid_param: string }
        Returns: Json
      }
      force_update_campaign_stats: {
        Args: { account_id_param: string }
        Returns: Json
      }
      sync_campaign_statistics_manually: {
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
