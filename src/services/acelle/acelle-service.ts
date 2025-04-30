
import { getAcelleAccounts, getAcelleAccountById, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount, updateLastSyncDate } from './api/accounts';
import { testAcelleConnection } from './api/connection';
import { checkApiAccess, fetchCampaignDetails, getAcelleCampaigns } from './api/campaigns';

// API proxy configuration with consistent URLs
export const ACELLE_PROXY_CONFIG = {
  // Always use the full URL to the Edge Function
  BASE_URL: "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy",
  ACELLE_API_URL: "https://emailing.plateforme-solution.net/api/v1", // Fix: Use the correct base path without duplication
  AUTH_METHOD: "token" // Use "token" for API token in URL (recommended by Acelle Mail documentation)
};

// Utility function to build properly encoded proxy URLs
export const buildProxyUrl = (endpoint: string, queryParams: Record<string, string> = {}): string => {
  // Start with the base Acelle API URL
  let targetUrl = `${ACELLE_PROXY_CONFIG.ACELLE_API_URL}/${endpoint}`;
  
  // Add query params if any
  if (Object.keys(queryParams).length > 0) {
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      urlParams.append(key, value);
    }
    targetUrl += `?${urlParams.toString()}`;
  }
  
  // Return the full proxy URL with encoded target URL
  return `${ACELLE_PROXY_CONFIG.BASE_URL}?url=${encodeURIComponent(targetUrl)}`;
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
  
  // Utilities
  buildProxyUrl,
  
  // Configuration
  config: ACELLE_PROXY_CONFIG
};

// Also export individual functions for direct imports
// Remove duplicate buildProxyUrl export to avoid conflict
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
  // buildProxyUrl removed from here to avoid duplicate export
};
