
import { getAcelleAccounts, getAcelleAccountById, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount, updateLastSyncDate } from './api/accounts';
import { testAcelleConnection } from './api/connection';
import { checkApiAccess, fetchCampaignDetails, getAcelleCampaigns } from './api/campaigns';

// API proxy configuration
export const ACELLE_PROXY_CONFIG = {
  BASE_URL: "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy",
  AUTH_METHOD: "token" // Use "token" for API token in URL, "header" for X-API-Key header
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
