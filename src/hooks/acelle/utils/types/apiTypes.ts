
export interface ApiAvailabilityResponse {
  available: boolean;
  error?: string;
  data?: any;
}

export interface AcelleConnectionResponse {
  success: boolean;
  error?: string;
  statusCode?: number;
  account?: string;
  endpoint?: string;
  data?: any;
}
