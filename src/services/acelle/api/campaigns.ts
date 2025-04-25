
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
      return null;
    }
    
    console.log(`Fetching details for campaign ${campaignUid} from account ${account.name}`);
    
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
      const errorText = await response.text();
      console.error(`Failed to fetch details for campaign ${campaignUid}: ${response.status}`, errorText);
      return null;
    }

    const campaignDetails = await response.json();
    console.log(`Successfully fetched details for campaign ${campaignUid}`, campaignDetails);
    return campaignDetails;
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
      const errorText = await response.text();
      console.error(`Error API: ${response.status}`, errorText);
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
      const errorText = await response.text();
      console.error(`Error fetching campaign details: ${response.status}`, errorText);
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
    return null;
  }
};
