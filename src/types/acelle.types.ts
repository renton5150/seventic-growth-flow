export interface AcelleAccount {
  id: string;
  name: string;
  api_endpoint: string;
  api_token: string;
  status: "active" | "inactive" | "error";
  mission_id?: string | null;
  cache_priority?: number;
  created_at?: string;
  updated_at?: string;
  last_sync_date?: string;
  last_sync_error?: string;
}

export interface AcelleCampaign {
  uid: string;
  campaign_uid: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_date: string | null;
  run_at: string | null;
  last_error?: string | null;
  content?: string;
  html?: string;
  delivery_info?: DeliveryInfo;
  statistics?: AcelleCampaignStatistics;
}

export interface AcelleCampaignStatistics {
  subscriber_count: number;
  delivered_count: number;
  delivered_rate: number;
  open_count: number;
  uniq_open_rate: number;
  click_count: number;
  click_rate: number;
  bounce_count: number;
  soft_bounce_count: number;
  hard_bounce_count: number;
  unsubscribe_count: number;
  abuse_complaint_count: number;
}

export interface DeliveryInfo {
  total?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  bounced?: number | {
    soft?: number;
    hard?: number;
    total?: number;
  };
  delivery_rate?: number;
  unique_open_rate?: number;
  click_rate?: number;
  unsubscribed?: number;
  complained?: number;
}

export interface CachedCampaign {
  account_id: string;
  campaign_uid: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_date: string;
  run_at: string;
  delivery_info: string;
  cache_updated_at: string;
  last_error?: string;
}

export interface AcelleConnectionDebug {
  success: boolean;
  accountName?: string;
  version?: string;
  errorMessage?: string;
}
