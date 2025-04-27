
export interface AcelleAccount {
  id: string;
  name: string;
  missionId?: string;
  missionName?: string;
  api_endpoint: string;
  api_token: string;
  status: "active" | "inactive";
  last_sync_date: string | null;
  createdAt?: string;
  updatedAt?: string;
  
  // Aliases for compatibility
  apiEndpoint?: string; // Alias for api_endpoint
  apiToken?: string; // Alias for api_token
  lastSyncDate?: string | null; // Alias for last_sync_date
}

export interface AcelleConnectionDebug {
  success: boolean;
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    params?: any;
  };
  responseData?: any;
  statusCode?: number;
  errorMessage?: string;
}

export interface AcelleCampaignBounced {
  soft: number;
  hard: number;
  total: number;
}

export interface AcelleCampaignDeliveryInfo {
  total: number;
  delivered: number;
  delivery_rate: number;
  opened: number;
  unique_open_rate: number;
  clicked: number;
  click_rate: number;
  bounced: AcelleCampaignBounced;
  bounce_rate: number;
  unsubscribed: number;
  unsubscribe_rate: number;
  complained: number;
}

export interface AcelleCampaignTracking {
  open_tracking: boolean;
  click_tracking: boolean;
}

export interface AcelleCampaign {
  uid: string;
  name: string;
  subject?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  run_at?: string;
  delivery_info?: AcelleCampaignDeliveryInfo;
}

export interface AcelleCampaignDetail extends AcelleCampaign {
  html?: string;
  plain?: string;
  statistics?: any;
  tracking?: AcelleCampaignTracking;
}
