import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail, AcelleConnectionDebug } from "@/types/acelle.types";
import { updateLastSyncDate } from "./accounts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Base URL for the Acelle API proxy
const ACELLE_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

// Helper function to check if API is accessible
export const checkApiAccess = async (account: AcelleAccount): Promise<boolean> => {
  try {
    console.log(`Testing API accessibility for account: ${account.name}`);
    
    // Get the auth session for the current user
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("No auth token available for API access check");
      return false;
    }
    
    // Fix potential URL issues by ensuring there's no trailing slash
    const apiEndpoint = account.apiEndpoint?.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
      
    if (!apiEndpoint) {
      console.error(`Invalid API endpoint for account: ${account.name}`);
      return false;
    }

    // Use the ping endpoint to check API accessibility
    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/me?api_token=ping&endpoint=${encodeURIComponent(apiEndpoint)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Acelle-Endpoint": apiEndpoint,
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error(`API accessibility check failed: ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log("API accessibility check result:", result);
    
    return result.status === 'active';
  } catch (error) {
    console.error("Error checking API accessibility:", error);
    return false;
  }
};

// Helper function to fetch campaign details
export const fetchCampaignDetails = async (account: AcelleAccount, campaignUid: string) => {
  try {
    // Fix potential URL issues by ensuring there's no trailing slash
    const apiEndpoint = account.apiEndpoint?.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
      
    if (!apiEndpoint || !account.apiToken) {
      console.error(`Invalid API configuration for account: ${account.name}`);
      return null;
    }
    
    // Get the auth session for the current user
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("No auth token available for API request");
      return null;
    }
    
    console.log(`Fetching details for campaign ${campaignUid} from account ${account.name}`);
    
    // First check API accessibility
    const isApiAccessible = await checkApiAccess(account);
    if (!isApiAccessible) {
      console.error("API is not accessible, cannot fetch campaign details");
      toast.error("L'API Acelle n'est pas accessible actuellement");
      return null;
    }
    
    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/campaigns/${campaignUid}?api_token=${account.apiToken}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Acelle-Endpoint": apiEndpoint,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = errorData.error || `Error ${response.status}`;
      } catch (e) {
        errorText = await response.text();
      }
      console.error(`Failed to fetch details for campaign ${campaignUid}: ${response.status}`, errorText);
      toast.error(`Erreur lors du chargement des détails: ${errorText}`);
      return null;
    }

    const campaignDetails = await response.json();
    console.log(`Successfully fetched details for campaign ${campaignUid}`, campaignDetails);
    return campaignDetails;
  } catch (error) {
    console.error(`Error fetching details for campaign ${campaignUid}:`, error);
    toast.error(`Erreur lors du chargement des détails: ${error.message || "Erreur inconnue"}`);
    return null;
  }
};

// Get campaigns for an account with pagination
export const getAcelleCampaigns = async (account: AcelleAccount, page: number = 1, limit: number = 10): Promise<AcelleCampaign[]> => {
  try {
    console.log(`Fetching campaigns for account ${account.name}, page ${page}, limit ${limit}`);
    
    // Add cache-control header to prevent browser caching
    const cacheKey = `${account.id}-${page}-${limit}-${Date.now()}`;
    
    // Check if the API endpoint has the correct format
    if (!account.apiEndpoint || !account.apiToken) {
      console.error(`Invalid API endpoint or token for account: ${account.name}`);
      return [];
    }

    // Fix potential URL issues by ensuring there's no trailing slash
    const apiEndpoint = account.apiEndpoint.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
    
    console.log(`Making request to endpoint: ${apiEndpoint}`);
    
    // Get the auth session for the current user
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("No auth token available for campaigns API request");
      return [];
    }
    
    // First check API accessibility
    const isApiAccessible = await checkApiAccess(account);
    if (!isApiAccessible) {
      console.error("API is not accessible, cannot fetch campaigns");
      toast.error("L'API Acelle n'est pas accessible actuellement");
      return [];
    }
    
    // Get campaign list with pagination and included stats
    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/campaigns?api_token=${account.apiToken}&page=${page}&per_page=${limit}&include_stats=true&cache_key=${cacheKey}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Acelle-Endpoint": apiEndpoint,
        "Authorization": `Bearer ${accessToken}`,
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch campaigns: ${response.status}`);
      
      if (response.status === 401 || response.status === 403) {
        toast.error("Erreur d'authentification avec l'API Acelle");
      } else if (response.status === 500) {
        toast.error("Erreur interne du serveur Acelle");
      } else {
        toast.error(`Erreur lors de la récupération des campagnes: ${response.status}`);
      }
      
      return [];
    }
    
    const campaigns = await response.json();
    console.log(`Fetched ${campaigns.length} campaigns for account ${account.name}`);
    
    // Update last sync date
    updateLastSyncDate(account.id);
    
    return campaigns;
  } catch (error) {
    console.error(`Error fetching campaigns for account ${account.name}:`, error);
    toast.error(`Erreur lors de la récupération des campagnes: ${error.message || "Erreur inconnue"}`);
    return [];
  }
};
