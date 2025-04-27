
// Define Acelle types for backward compatibility with existing components
export type LegacyType = 'removed';

export interface AcelleAccount {
  id: string;
  name: string;
  api_endpoint: string;
  api_token: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_sync_date?: string;
  last_sync_error?: string;
  cache_priority?: number;
}

export interface AcelleCampaignDetail {
  id: string;
  uid: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_at?: string;
  delivery_info?: Record<string, any>;
}

export interface AcelleConnectionDebug {
  success: boolean;
  message?: string;
  error?: string;
  request?: {
    url: string;
    method: string;
    headers?: Record<string, string>;
  };
  responseData?: {
    statusCode?: number;
    message?: string;
    error?: string;
    [key: string]: any;
  };
}
