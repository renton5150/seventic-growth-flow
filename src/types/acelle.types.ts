
export type AcelleAccountStatus = "active" | "inactive";

export interface AcelleAccount {
  id: string;
  missionId: string;
  missionName?: string;
  name: string;
  apiEndpoint: string;
  apiToken: string;
  lastSyncDate: Date | string | null;
  status: AcelleAccountStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AcelleCampaign {
  uid: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_error: string | null;
  run_at: string | null;
  delivery_info: {
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
    };
    unsubscribed: number;
    complained: number;
  };
}

export interface AcelleCampaignDetail extends AcelleCampaign {
  html: string;
  plain: string;
  template: {
    uid: string;
    name: string;
  };
  tracking: {
    open_tracking: boolean;
    click_tracking: boolean;
    unsubscribe_url: string;
  };
}

// Interface pour le débogage de la connexion
export interface AcelleConnectionDebug {
  success: boolean;
  statusCode?: number;
  responseData?: any;
  errorMessage?: string;
  request?: {
    url: string;
    headers: Record<string, string>;
  };
}
