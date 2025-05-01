
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
  
  statistics?: {
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
  };
  
  meta?: Record<string, any>;
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
