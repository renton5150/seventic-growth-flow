
export interface AcelleAccount {
  id: string;
  created_at: string;
  name: string;
  apiEndpoint: string;
  apiToken: string;
  status: 'active' | 'inactive' | 'error';
  lastSyncDate: string | null;
  lastSyncError: string | null;
  cachePriority: number;
  
  // Propriétés additionnelles utilisées dans le code
  missionId?: string;
  missionName?: string;
  createdAt?: string;
  updatedAt?: string;
  apiKey?: string;
  updated_at?: string;
}

interface AcelleCampaignStatistics {
  subscriber_count?: number;
  delivered_count?: number;
  delivered_rate?: number;
  open_count?: number;
  uniq_open_rate?: number;
  click_count?: number;
  click_rate?: number;
  bounce_count?: number;
  soft_bounce_count?: number;
  hard_bounce_count?: number;
  unsubscribe_count?: number;
  abuse_complaint_count?: number;
}

export interface AcelleCampaign {
  uid: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_date: string;
  run_at: string;
  last_error?: string;
  
  delivery_info?: {
    total?: number;
    delivery_rate?: number;
    unique_open_rate?: number;
    click_rate?: number;
    bounce_rate?: number;
    unsubscribe_rate?: number;
    delivered?: number;
    opened?: number;
    clicked?: number;
    bounced?: {
      soft?: number;
      hard?: number;
      total?: number;
    };
    unsubscribed?: number;
    complained?: number;
  };
  
  statistics?: AcelleCampaignStatistics;
  
  meta?: Record<string, any>;
  
  // Propriétés nécessaires pour la compatibilité avec le code existant
  track?: Record<string, any>;
  report?: Record<string, any>;
  
  // Pour la compatibilité avec la structure de la base de données
  campaign_uid?: string;
}

export interface AcelleCampaignDetail extends AcelleCampaign {
  content?: string;
  html?: string;
  plain?: string;
  tracking?: {
    open_tracking?: boolean;
    click_tracking?: boolean;
  };
}

export interface AcelleCampaignDeliveryInfo {
  total: number;
  delivery_rate: number;
  unique_open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: {
    soft: number;
    hard: number;
    total: number;
  };
  unsubscribed: number;
  complained: number;
}

export interface AcelleConnectionDebug {
  success: boolean;
  timestamp: string;
  errorMessage?: string;
  statusCode?: number;
  responseData?: any;
  duration?: number;
  request?: {
    url?: string;
    headers?: Record<string, string>;
    method?: string;
    body?: any;
  };
  response?: {
    statusCode?: number;
    body?: any;
  };
}

// Type spécifique pour le cache des campagnes
export interface CachedCampaign {
  account_id: string;
  cache_updated_at: string;
  campaign_uid: string;
  created_at: string;
  delivery_date: string | null;
  delivery_info: any;
  id: string;
  last_error: string | null;
  name: string;
  run_at: string | null;
  status: string;
  subject: string;
  updated_at: string;
}

// Type pour la connexion logs
export interface AcelleConnectionLog {
  id: string;
  account_id: string;
  timestamp: string;
  success: boolean;
  duration_ms?: number;
  status_code?: number;
  error_message?: string;
  request_url?: string;
  request_method?: string;
  response_data?: any;
}
