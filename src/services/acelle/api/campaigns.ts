
import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail } from "@/types/acelle.types";
import { updateLastSyncDate } from "./accounts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildProxyUrl, ACELLE_PROXY_CONFIG } from "@/services/acelle/acelle-service";

// Helper function to check if API is accessible with improved debugging
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

    // Use the buildProxyUrl function to ensure proper URL construction
    const proxyUrl = buildProxyUrl('me', { api_token: account.apiToken });
    
    console.log(`Checking API access with URL: ${proxyUrl}`);
    
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Acelle-Endpoint": apiEndpoint,
        "X-Auth-Method": "token",
        "X-Debug-Level": "verbose",
        "X-Wake-Request": "true"
      }
    });

    if (!response.ok) {
      console.error(`API accessibility check failed: ${response.status}`);
      
      // Log detailed response for debugging
      try {
        const errorText = await response.text();
        console.error("API accessibility error details:", errorText);
      } catch (e) {
        console.error("Could not read error response");
      }
      
      return false;
    }

    const result = await response.json();
    console.log("API accessibility check result:", result);
    
    return result && (result.status === 'active' || !!result.id);
  } catch (error) {
    console.error("Error checking API accessibility:", error);
    return false;
  }
};

// Enhanced helper function to fetch campaign details with better error handling
export const fetchCampaignDetails = async (account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail | null> => {
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
    
    // Using CORS proxy with properly encoded URL
    const proxyUrl = buildProxyUrl(`campaigns/${campaignUid}`, { api_token: account.apiToken });
    
    console.log(`Fetching campaign details with URL: ${proxyUrl}`);
    
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Debug-Level": "verbose",
        "X-Acelle-Endpoint": apiEndpoint,
        "X-Auth-Method": "token"
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
    toast.error(`Erreur lors du chargement des détails: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    return null;
  }
};

// Enhanced function to get campaigns with improved statistics extraction
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
    
    // Using our buildProxyUrl utility function with campaign parameters
    const proxyUrl = buildProxyUrl('campaigns', {
      api_token: account.apiToken,
      page: page.toString(),
      per_page: limit.toString(),
      include_stats: 'true',
      cache_key: cacheKey
    });
    
    console.log(`Fetching campaigns with URL: ${proxyUrl}`);
    
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Debug-Level": "verbose",
        "X-Acelle-Endpoint": apiEndpoint,
        "X-Auth-Method": "token"
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch campaigns: ${response.status}`);
      
      // Log detailed response for debugging
      try {
        const errorText = await response.text();
        console.error("Fetch campaigns error details:", errorText);
      } catch (e) {
        console.error("Could not read error response");
      }
      
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
    console.log("Sample campaign data:", campaigns.length > 0 ? campaigns[0] : "No campaigns");
    
    // Process campaigns to ensure all required fields are present with improved parsing
    const processedCampaigns = campaigns.map((campaign: any) => {
      // Safely extract number values with improved parsing
      const safeParseInt = (value: any) => {
        if (value === undefined || value === null) return 0;
        const num = parseInt(value);
        return isNaN(num) ? 0 : num;
      };
      
      const safeParseFloat = (value: any) => {
        if (value === undefined || value === null) return 0;
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      };
      
      // Logging statistics for debugging
      console.log(`Campaign ${campaign.name || 'Unknown'} statistics:`, campaign.statistics);
      
      // Ensure delivery_info has all required fields
      const deliveryInfo = {
        total: safeParseInt(campaign.statistics?.subscriber_count) || safeParseInt(campaign.delivery_info?.total) || 0,
        delivery_rate: safeParseFloat(campaign.statistics?.delivered_rate) || safeParseFloat(campaign.delivery_info?.delivery_rate) || 0,
        unique_open_rate: safeParseFloat(campaign.statistics?.uniq_open_rate) || safeParseFloat(campaign.delivery_info?.unique_open_rate) || 0,
        click_rate: safeParseFloat(campaign.statistics?.click_rate) || safeParseFloat(campaign.delivery_info?.click_rate) || 0,
        bounce_rate: safeParseFloat(campaign.statistics?.bounce_rate) || safeParseFloat(campaign.delivery_info?.bounce_rate) || 0,
        unsubscribe_rate: safeParseFloat(campaign.statistics?.unsubscribe_rate) || safeParseFloat(campaign.delivery_info?.unsubscribe_rate) || 0,
        delivered: safeParseInt(campaign.statistics?.delivered_count) || safeParseInt(campaign.delivery_info?.delivered) || 0,
        opened: safeParseInt(campaign.statistics?.open_count) || safeParseInt(campaign.delivery_info?.opened) || 0,
        clicked: safeParseInt(campaign.statistics?.click_count) || safeParseInt(campaign.delivery_info?.clicked) || 0,
        unsubscribed: safeParseInt(campaign.statistics?.unsubscribe_count) || safeParseInt(campaign.delivery_info?.unsubscribed) || 0,
        complained: safeParseInt(campaign.statistics?.abuse_complaint_count) || safeParseInt(campaign.delivery_info?.complained) || 0,
        bounced: {
          soft: safeParseInt(campaign.statistics?.soft_bounce_count) || safeParseInt(campaign.delivery_info?.bounced?.soft) || 0,
          hard: safeParseInt(campaign.statistics?.hard_bounce_count) || safeParseInt(campaign.delivery_info?.bounced?.hard) || 0,
          total: safeParseInt(campaign.statistics?.bounce_count) || safeParseInt(campaign.delivery_info?.bounced?.total) || 0
        }
      };
      
      // Convert any existing stats
      const statistics = {
        subscriber_count: safeParseInt(campaign.statistics?.subscriber_count) || deliveryInfo.total || 0,
        delivered_count: safeParseInt(campaign.statistics?.delivered_count) || deliveryInfo.delivered || 0,
        delivered_rate: safeParseFloat(campaign.statistics?.delivered_rate) || deliveryInfo.delivery_rate || 0,
        open_count: safeParseInt(campaign.statistics?.open_count) || deliveryInfo.opened || 0,
        uniq_open_rate: safeParseFloat(campaign.statistics?.uniq_open_rate) || deliveryInfo.unique_open_rate || 0,
        click_count: safeParseInt(campaign.statistics?.click_count) || deliveryInfo.clicked || 0,
        click_rate: safeParseFloat(campaign.statistics?.click_rate) || deliveryInfo.click_rate || 0,
        bounce_count: safeParseInt(campaign.statistics?.bounce_count) || deliveryInfo.bounced.total || 0,
        soft_bounce_count: safeParseInt(campaign.statistics?.soft_bounce_count) || deliveryInfo.bounced.soft || 0,
        hard_bounce_count: safeParseInt(campaign.statistics?.hard_bounce_count) || deliveryInfo.bounced.hard || 0,
        unsubscribe_count: safeParseInt(campaign.statistics?.unsubscribe_count) || deliveryInfo.unsubscribed || 0,
        abuse_complaint_count: safeParseInt(campaign.statistics?.abuse_complaint_count) || deliveryInfo.complained || 0
      };

      return {
        ...campaign,
        delivery_info: deliveryInfo,
        statistics: statistics,
        delivery_date: campaign.delivery_date || campaign.run_at || campaign.delivery_at
      };
    });
    
    // Update last sync date
    updateLastSyncDate(account.id);
    
    return processedCampaigns;
  } catch (error) {
    console.error(`Error fetching campaigns for account ${account.name}:`, error);
    toast.error(`Erreur lors de la récupération des campagnes: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    return [];
  }
};
