
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
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Acelle-Endpoint": apiEndpoint,
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
      console.error(`Error API: ${response.status}`, errorText);
      toast.error(`Erreur API: ${errorText}`);
      throw new Error(`Error API: ${response.status}`);
    }

    const campaigns = await response.json();
    console.log(`Received ${campaigns.length} campaigns from API`);
    
    if (campaigns.length > 0) {
      console.log("Sample campaign data:", campaigns[0]);
      if (campaigns[0].statistics) {
        console.log("Statistics details:", campaigns[0].statistics);
      }
    }
    
    // Map the campaigns with their included statistics
    const mappedCampaigns = campaigns.map((campaign: any) => {
      // Make sure we have all statistics fields properly populated
      const statistics = campaign.statistics || {};
      
      // Calculate actual numbers and rates
      const subscriberCount = parseInt(statistics.subscriber_count) || 0;
      const deliveredCount = parseInt(statistics.delivered_count) || 0;
      const openCount = parseInt(statistics.open_count) || 0;
      const clickCount = parseInt(statistics.click_count) || 0;
      const bounceCount = parseInt(statistics.bounce_count) || 0;
      const unsubscribeCount = parseInt(statistics.unsubscribe_count) || 0;
      
      // Calculate rates based on subscriber count
      const deliveryRate = subscriberCount > 0 ? deliveredCount / subscriberCount : 0;
      const openRate = deliveredCount > 0 ? openCount / deliveredCount : 0;
      const clickRate = deliveredCount > 0 ? clickCount / deliveredCount : 0;
      const bounceRate = subscriberCount > 0 ? bounceCount / subscriberCount : 0;
      const unsubscribeRate = deliveredCount > 0 ? unsubscribeCount / deliveredCount : 0;

      return {
        ...campaign,
        delivery_info: {
          total: subscriberCount,
          delivery_rate: deliveryRate,
          unique_open_rate: statistics.uniq_open_rate || openRate,
          click_rate: clickRate,
          bounce_rate: bounceRate,
          unsubscribe_rate: unsubscribeRate,
          delivered: deliveredCount,
          opened: openCount,
          clicked: clickCount,
          bounced: {
            soft: parseInt(statistics.soft_bounce_count) || 0,
            hard: parseInt(statistics.hard_bounce_count) || 0,
            total: bounceCount
          },
          unsubscribed: unsubscribeCount,
          complained: parseInt(statistics.abuse_complaint_count) || 0
        },
        delivery_date: campaign.delivery_at || campaign.run_at
      };
    });
    
    // Log des données mappées pour débogage
    console.log(`Mapped ${mappedCampaigns.length} campaigns with statistics`);
    if (mappedCampaigns.length > 0) {
      console.log("Sample mapped campaign data:", {
        name: mappedCampaigns[0].name,
        delivery_info: mappedCampaigns[0].delivery_info
      });
    }
    
    // Update last sync date after successful fetch, but don't await it to speed up response
    updateLastSyncDate(account.id).catch(error => 
      console.error(`Failed to update last sync date for account ${account.id}:`, error)
    );
    
    return mappedCampaigns;
  } catch (error) {
    console.error(`Error fetching campaigns for account ${account.id}:`, error);
    toast.error(`Erreur lors du chargement des campagnes: ${error.message || "Erreur inconnue"}`);
    return [];
  }
};

// Get campaign details
export const getAcelleCampaignDetails = async (account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail | null> => {
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
      console.error("No auth token available for campaign details API request");
      return null;
    }
    
    console.log(`Fetching details for campaign ${campaignUid}`);
    
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
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Acelle-Endpoint": apiEndpoint,
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
      console.error(`Error fetching campaign details: ${response.status}`, errorText);
      toast.error(`Erreur lors du chargement des détails: ${errorText}`);
      throw new Error(`Error API: ${response.status}`);
    }

    const campaignDetails = await response.json();
    console.log(`Successfully fetched details for campaign ${campaignUid}`, campaignDetails);
    
    // Make sure we have consistent data structures even if some properties are missing
    const formattedDetails = {
      ...campaignDetails,
      statistics: campaignDetails.statistics || {},
      delivery_info: campaignDetails.delivery_info || {
        total: parseInt(campaignDetails.statistics?.subscriber_count) || 0,
        delivery_rate: parseFloat(campaignDetails.statistics?.delivered_rate) || 0,
        unique_open_rate: parseFloat(campaignDetails.statistics?.uniq_open_rate) || 0,
        click_rate: parseFloat(campaignDetails.statistics?.click_rate) || 0,
        bounce_rate: parseFloat(campaignDetails.statistics?.bounce_rate) || 0,
        unsubscribe_rate: parseFloat(campaignDetails.statistics?.unsubscribe_rate) || 0,
        delivered: parseInt(campaignDetails.statistics?.delivered_count) || 0,
        opened: parseInt(campaignDetails.statistics?.open_count) || 0,
        clicked: parseInt(campaignDetails.statistics?.click_count) || 0,
        bounced: {
          soft: parseInt(campaignDetails.statistics?.soft_bounce_count) || 0,
          hard: parseInt(campaignDetails.statistics?.hard_bounce_count) || 0,
          total: parseInt(campaignDetails.statistics?.bounce_count) || 0
        },
        unsubscribed: parseInt(campaignDetails.statistics?.unsubscribe_count) || 0,
        complained: parseInt(campaignDetails.statistics?.abuse_complaint_count) || 0
      }
    };
    
    return formattedDetails;
  } catch (error) {
    console.error(`Error fetching campaign details ${campaignUid}:`, error);
    toast.error(`Erreur lors du chargement des détails: ${error.message || "Erreur inconnue"}`);
    return null;
  }
};

// Helper function to check API availability
export const checkApiAvailability = async (account?: AcelleAccount): Promise<{
  available: boolean;
  endpoints: { [key: string]: boolean };
  debugInfo?: AcelleConnectionDebug;
}> => {
  try {
    const endpoints = {
      campaigns: false,
      details: false
    };
    
    const debugInfo: AcelleConnectionDebug = {
      success: false,
      timestamp: new Date().toISOString(),
      request: {
        url: ACELLE_PROXY_BASE_URL,
        headers: {}
      }
    };

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      return { available: false, endpoints, debugInfo: { ...debugInfo, errorMessage: "No auth token available" } };
    }

    // Test campaigns endpoint
    try {
      const campaignsResponse = await fetch(`${ACELLE_PROXY_BASE_URL}/ping`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache'
        }
      });
      endpoints.campaigns = campaignsResponse.ok;
    } catch (error) {
      console.error("Error testing campaigns endpoint:", error);
    }

    // Test details endpoint
    if (account) {
      try {
        const detailsResponse = await fetch(`${ACELLE_PROXY_BASE_URL}/ping?api_token=${account.apiToken}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Acelle-Endpoint': account.apiEndpoint,
            'Cache-Control': 'no-cache'
          }
        });
        endpoints.details = detailsResponse.ok;
      } catch (error) {
        console.error("Error testing details endpoint:", error);
      }
    }

    const available = Object.values(endpoints).some(status => status);
    
    return {
      available,
      endpoints,
      debugInfo: {
        ...debugInfo,
        success: available,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Error checking API availability:", error);
    return {
      available: false,
      endpoints: { campaigns: false, details: false },
      debugInfo: {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }
    };
  }
};

