
import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail } from "@/types/acelle.types";
import { updateLastSyncDate } from "./accounts";

// Base URL for the Acelle API proxy
const ACELLE_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

// Helper function to fetch campaign details
export const fetchCampaignDetails = async (account: AcelleAccount, campaignUid: string) => {
  try {
    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/campaigns/${campaignUid}?api_token=${account.apiToken}`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
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
    // Step 1: Get basic campaign list with pagination
    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/campaigns?api_token=${account.apiToken}&page=${page}&per_page=${limit}`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Error API: ${response.status}`);
    }

    const basicCampaigns = await response.json();
    
    // Step 2: Fetch detailed stats for each campaign
    const campaignsWithStats = await Promise.all(
      basicCampaigns.map(async (campaign: any) => {
        const details = await fetchCampaignDetails(account, campaign.uid);
        
        return {
          ...campaign,
          delivery_info: details?.statistics ? {
            total: details.statistics.subscriber_count || 0,
            delivery_rate: details.statistics.delivered_rate || 0,
            unique_open_rate: details.statistics.uniq_open_rate || 0,
            click_rate: details.statistics.click_rate || 0,
            bounce_rate: details.statistics.bounce_count / (details.statistics.subscriber_count || 1),
            unsubscribe_rate: details.statistics.unsubscribe_count / (details.statistics.subscriber_count || 1),
            delivered: details.statistics.delivered_count || 0,
            opened: details.statistics.open_count || 0,
            clicked: details.statistics.click_count || 0,
            bounced: {
              soft: details.statistics.soft_bounce_count || 0,
              hard: details.statistics.hard_bounce_count || 0,
              total: details.statistics.bounce_count || 0
            },
            unsubscribed: details.statistics.unsubscribe_count || 0,
            complained: details.statistics.abuse_complaint_count || 0
          } : undefined,
          delivery_date: campaign.delivery_at || campaign.run_at
        };
      })
    );
    
    // Update last sync date after successful fetch
    await updateLastSyncDate(account.id);
    
    return campaignsWithStats;
  } catch (error) {
    console.error(`Error fetching campaigns for account ${account.id}:`, error);
    return [];
  }
};

// Get campaign details
export const getAcelleCampaignDetails = async (account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail | null> => {
  try {
    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/campaigns/${campaignUid}?api_token=${account.apiToken}`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Error API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching campaign details ${campaignUid}:`, error);
    return null;
  }
};
