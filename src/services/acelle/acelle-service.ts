
import { getAcelleAccounts, getAcelleAccountById, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount, updateLastSyncDate } from './api/accounts';
import { testAcelleConnection } from './api/connection';
import { checkApiAccess, fetchCampaignDetails, getAcelleCampaigns } from './api/campaigns';

// API proxy configuration
export const ACELLE_PROXY_CONFIG = {
  BASE_URL: "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy",
  ACELLE_API_URL: "https://emailing.plateforme-solution.net/api/v1",
  AUTH_METHOD: "token" // Use "token" for API token in URL (recommended by Acelle Mail documentation)
};

// Export all functions under a single acelleService object
export const acelleService = {
  // Account management
  getAcelleAccounts,
  getAcelleAccountById,
  createAcelleAccount,
  updateAcelleAccount,
  deleteAcelleAccount,
  
  // Connection testing
  testAcelleConnection,
  checkApiAccess,
  
  // Campaign operations
  getAcelleCampaigns,
  fetchCampaignDetails,
  updateLastSyncDate,
  
  // Configuration
  config: ACELLE_PROXY_CONFIG
};

// Also export individual functions for direct imports
export {
  getAcelleAccounts,
  getAcelleAccountById,
  createAcelleAccount,
  updateAcelleAccount,
  deleteAcelleAccount,
  testAcelleConnection,
  checkApiAccess,
  getAcelleCampaigns,
  fetchCampaignDetails,
  updateLastSyncDate
};
