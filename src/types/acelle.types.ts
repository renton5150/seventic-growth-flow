export interface AcelleAccount {
  id: string;
  created_at: string;
  name: string;
  api_endpoint: string;
  api_token: string;
  status: 'active' | 'inactive' | 'error';
  last_sync_date: string | null;
  last_sync_error: string | null;
  cache_priority: number;
  
  // Optional properties
  mission_id?: string;
  updated_at?: string;
  cache_last_updated?: string;
}

// Interface claire pour les statistiques des campagnes
export interface AcelleCampaignStatistics {
  subscriber_count: number;
  delivered_count: number;
  delivered_rate: number;
  open_count: number;
  uniq_open_count?: number;
  uniq_open_rate: number;
  unique_open_rate?: number;  // Pour compatibilité avec certaines réponses API
  click_count: number;
  click_rate: number;
  bounce_count: number;
  soft_bounce_count: number;
  hard_bounce_count: number;
  unsubscribe_count: number;
  abuse_complaint_count: number;
  
  // Propriétés additionnelles possibles dans les réponses d'API
  open_rate?: number;
  complaint_count?: number;
  last_open?: string;
  last_click?: string;
  abuse_feedback_count?: number;
  
  // Propriétés pour les listes d'éléments
  top_locations?: string[];
  top_open_subscribers?: Array<{uid: string | null, email: string}>;
  links?: any[];
  
  // Propriétés formatées pour l'affichage
  total?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
}

// Interface pour la structure delivery_info
export interface DeliveryInfo {
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
  } | number;
  unsubscribed?: number;
  complained?: number;
  bounce_count?: number;
  
  // Ajout de propriétés supplémentaires pour une compatibilité maximale
  subscriber_count?: number;
  delivered_count?: number;
  delivered_rate?: number;
  open_count?: number;
  open_rate?: number;
  uniq_open_rate?: number;
}

export interface AcelleCampaign {
  uid: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_date: string | null;
  run_at: string | null;
  last_error?: string | null;
  
  delivery_info?: DeliveryInfo;
  
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
  } | number;
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
  apiVersion?: string;
  responseTime?: number;
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

// Type pour la table de statistiques de campagne
export interface CampaignStatsCache {
  account_id: string;
  campaign_uid: string;
  id: string;
  last_updated: string;
  statistics: any;
  delivery_info: any; // Ajout du champ delivery_info manquant
}

