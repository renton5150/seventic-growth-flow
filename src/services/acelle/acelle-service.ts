
import { getAcelleAccounts, getAcelleAccountById, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount, updateLastSyncDate } from './api/accounts';
import { testAcelleConnection } from './api/connection';
import { checkApiAccess, fetchCampaignDetails, getAcelleCampaigns } from './api/campaigns';

// API proxy configuration with consistent URLs
export const ACELLE_PROXY_CONFIG = {
  // Always use the full URL to the Edge Function
  BASE_URL: "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy",
  ACELLE_API_URL: "https://emailing.plateforme-solution.net/api/v1", // Use correct API path without duplication
  AUTH_METHOD: "token" // Use "token" for API token in URL (recommended by Acelle Mail documentation)
};

// Enhanced utility function to build properly encoded proxy URLs with better error handling
export const buildProxyUrl = (endpoint: string, queryParams: Record<string, string> = {}): string => {
  try {
    // Clean the endpoint to ensure we don't have leading or trailing slashes
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
    
    // Start with the base Acelle API URL
    let targetUrl = `${ACELLE_PROXY_CONFIG.ACELLE_API_URL}/${cleanEndpoint}`;
    
    // Add query params if any
    if (Object.keys(queryParams).length > 0) {
      const urlParams = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null) {
          urlParams.append(key, value);
        }
      }
      targetUrl += `?${urlParams.toString()}`;
    }
    
    // Add timestamp param to avoid caching if not already present
    if (!queryParams.t && !queryParams.timestamp && !queryParams.cache_key) {
      const timestamp = Date.now();
      targetUrl += targetUrl.includes('?') ? `&t=${timestamp}` : `?t=${timestamp}`;
    }
    
    // Return the full proxy URL with correctly encoded target URL
    return `${ACELLE_PROXY_CONFIG.BASE_URL}?url=${encodeURIComponent(targetUrl)}`;
  } catch (error) {
    console.error("Error building proxy URL:", error);
    throw new Error(`Failed to build proxy URL for endpoint ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
  }
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
