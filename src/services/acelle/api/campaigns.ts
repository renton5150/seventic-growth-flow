
import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail } from "@/types/acelle.types";
import { updateLastSyncDate } from "./accounts";
import { supabase } from "@/integrations/supabase/client";

// Base URL for the Acelle API proxy
const ACELLE_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

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
    }
    
    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/campaigns/${campaignUid}?api_token=${account.apiToken}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Acelle-Endpoint": apiEndpoint,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch details for campaign ${campaignUid}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching details for campaign ${campaignUid}:`, error);
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
    }
    
    // Get campaign list with pagination and included stats
    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/campaigns?api_token=${account.apiToken}&page=${page}&per_page=${limit}&include_stats=true&cache_key=${cacheKey}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Acelle-Endpoint": apiEndpoint,
        ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error API: ${response.status}`, errorText);
      throw new Error(`Error API: ${response.status}`);
    }

    const campaigns = await response.json();
    console.log(`Received ${campaigns.length} campaigns from API`);
    
    if (campaigns.length > 0) {
      console.log("Sample campaign data:", campaigns[0]);
    }
    
    // Map the campaigns with their included statistics
    const mappedCampaigns = campaigns.map((campaign: any) => {
      console.log(`Processing campaign ${campaign.uid} statistics:`, campaign.statistics);
      
      return {
        ...campaign,
        delivery_info: campaign.statistics ? {
          total: campaign.statistics.subscriber_count || 0,
          delivery_rate: campaign.statistics.delivered_rate || 0,
          unique_open_rate: campaign.statistics.uniq_open_rate || 0,
          click_rate: campaign.statistics.click_rate || 0,
          bounce_rate: campaign.statistics.bounce_count ? campaign.statistics.bounce_count / (campaign.statistics.subscriber_count || 1) : 0,
          unsubscribe_rate: campaign.statistics.unsubscribe_count ? campaign.statistics.unsubscribe_count / (campaign.statistics.subscriber_count || 1) : 0,
          delivered: campaign.statistics.delivered_count || 0,
          opened: campaign.statistics.open_count || 0,
          clicked: campaign.statistics.click_count || 0,
          bounced: {
            soft: campaign.statistics.soft_bounce_count || 0,
            hard: campaign.statistics.hard_bounce_count || 0,
            total: campaign.statistics.bounce_count || 0
          },
          unsubscribed: campaign.statistics.unsubscribe_count || 0,
          complained: campaign.statistics.abuse_complaint_count || 0
        } : undefined,
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
    }
    
    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/campaigns/${campaignUid}?api_token=${account.apiToken}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Acelle-Endpoint": apiEndpoint,
        ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching campaign details: ${response.status}`, errorText);
      throw new Error(`Error API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching campaign details ${campaignUid}:`, error);
    return null;
  }
};
