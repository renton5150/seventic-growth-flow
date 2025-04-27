
// AcelleAccount représente un compte Acelle (auquel on peut se connecter pour utiliser l'API)
export interface AcelleAccount {
  id: string;
  name: string;
  api_endpoint: string;
  api_token: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  mission_id?: string;
  last_sync_date?: string;
  cache_last_updated?: string;
  cache_priority?: number;
}

// Debug de la connexion à l'API Acelle
export interface AcelleConnectionDebug {
  success: boolean;
  errorMessage?: string;
  statusCode?: number;
  timeTaken?: number;
  endpointTested?: string;
}

// AcelleDeliveryInfo contient les statistiques d'une campagne
export interface AcelleDeliveryInfo {
  total_emails?: number;
  delivered?: number;
  failed?: number;
  open_rate?: number;
  unique_open_rate?: number;
  click_rate?: number;
  bounce_rate?: number;
  unsubscribe_rate?: number;
  feedback_rate?: number;
  abuse_rate?: number;
}

// AcelleCampaign représente une campagne email sur Acelle
export interface AcelleCampaign {
  uid: string;
  name: string;
  subject?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  run_at?: string;
  delivery_info?: AcelleDeliveryInfo;
  delivery_date?: string;
}

// AcelleCampaignDetail contient les détails d'une campagne
export interface AcelleCampaignDetail extends AcelleCampaign {
  html_content?: string;
  plain_content?: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  tracking?: {
    open_track?: boolean;
    click_track?: boolean;
    unsubscribe_url?: boolean;
  };
  statistics?: {
    subscriber_count?: number;
    unique_open_count?: number;
    open_count?: number;
    unique_click_count?: number;
    click_count?: number;
    unsubscribe_count?: number;
    bounce_count?: number;
    feedback_count?: number;
    last_activity?: string;
  };
}

// Options de filtrage des campagnes
export interface AcelleCampaignFilterOptions {
  status?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  search?: string;
  page?: number;
  per_page?: number;
}

// AcelleStats représente les statistiques globales de toutes les campagnes
export interface AcelleStats {
  totalCampaigns: number;
  campaignsStatus: {
    [key: string]: number;
  };
  averageOpenRate: number;
  averageClickRate: number;
  totalDeliveredEmails: number;
  successfulCampaigns: number;
  failedCampaigns: number;
  pendingCampaigns: number;
}
