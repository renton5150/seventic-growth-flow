
export interface AcelleAccount {
  id: string;
  name: string;
  api_endpoint: string;
  api_token: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  last_sync_date: string | null;
  mission_id?: string | null;
  
  // Backward compatibility aliases
  apiEndpoint?: string; // alias for api_endpoint
  apiToken?: string;    // alias for api_token
  lastSyncDate?: string | null; // alias for last_sync_date
  missionId?: string;   // alias for mission_id
  missionName?: string; // Added for compatibility
  createdAt?: string;   // alias for created_at
  updatedAt?: string;   // alias for updated_at
}

export interface AcelleCampaign {
  uid: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  run_at: string | null;
  delivery_info: AcelleCampaignDeliveryInfo;
  tracking?: AcelleCampaignTracking;
  statistics?: any; // Adding this property
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

export interface AcelleCampaignTracking {
  open_tracking: boolean;
  click_tracking: boolean;
}

export interface AcelleCampaignDetail extends AcelleCampaign {
  html?: string; 
  plain?: string;
  statistics?: any;
}

export interface AcelleConnectionDebug {
  success: boolean;
  errorMessage?: string;
  statusCode?: number;
  request?: {
    url: string;
    method: string;
    headers: Record<string, string>;
  };
  response?: any;
  responseData?: any; // For backward compatibility
  timestamp?: string; // For backward compatibility
}
