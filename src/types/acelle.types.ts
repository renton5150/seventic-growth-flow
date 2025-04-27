
export interface AcelleAccount {
  id: string;
  created_at: string;
  name: string;
  apiEndpoint: string;
  apiToken: string;
  status: 'active' | 'inactive' | 'error';
  lastSyncDate: string | null;
  lastSyncError: string | null; // Add this line
  cachePriority: number;
  
  // Additional properties used in the codebase
  missionId?: string;
  missionName?: string;
  createdAt?: string;
  updatedAt?: string;
  apiKey?: string;
  updated_at?: string; // Allow both naming conventions during transition
}
