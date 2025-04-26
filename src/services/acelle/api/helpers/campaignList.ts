
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkApiAccess } from "./apiAccess";
import { updateLastSyncDate } from "../accounts";

const ACELLE_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

export const getAcelleCampaigns = async (account: AcelleAccount, page: number = 1, limit: number = 10): Promise<AcelleCampaign[]> => {
  try {
    console.log(`Fetching campaigns for account ${account.name}, page ${page}, limit ${limit}`);
    
    const cacheKey = `${account.id}-${page}-${limit}-${Date.now()}`;
    
    if (!account.apiEndpoint || !account.apiToken) {
      console.error(`Invalid API endpoint or token for account: ${account.name}`);
      return [];
    }

    const apiEndpoint = account.apiEndpoint.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
    
    console.log(`Making request to endpoint: ${apiEndpoint}`);
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("No auth token available for campaigns API request");
      return [];
    }
    
    const isApiAccessible = await checkApiAccess(account);
    if (!isApiAccessible) {
      console.error("API is not accessible, cannot fetch campaigns");
      toast.error("L'API Acelle n'est pas accessible actuellement");
      return [];
    }
    
    const response = await fetch(`${ACELLE_PROXY_BASE_URL}/campaigns`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Authorization": `Bearer ${accessToken}`,
        "X-Acelle-Endpoint": apiEndpoint,
        "X-Acelle-Token": account.apiToken,
        "X-Cache-Key": cacheKey,
        "X-Page": page.toString(),
        "X-Per-Page": limit.toString(),
        "X-Include-Stats": "true"
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
    console.log("Raw campaigns data received:", campaigns.length);
    if (campaigns.length > 0) {
      console.log("Sample raw campaign data:", JSON.stringify(campaigns[0]).substring(0, 300));
    }
    
    const mappedCampaigns = campaigns.map((campaign: any) => {
      const statistics = campaign.statistics || {};
      console.log(`Processing campaign ${campaign.name}, statistics:`, statistics);
      
      // Convert all numeric values from string to number
      const subscriberCount = parseInt(statistics.subscriber_count) || 0;
      const deliveredCount = parseInt(statistics.delivered_count) || 0;
      const openCount = parseInt(statistics.open_count) || 0;
      const clickCount = parseInt(statistics.click_count) || 0;
      const bounceCount = parseInt(statistics.bounce_count) || 0;
      const unsubscribeCount = parseInt(statistics.unsubscribe_count) || 0;
      
      // Calculate rates safely (prevent division by zero)
      const deliveryRate = subscriberCount > 0 ? deliveredCount / subscriberCount : 0;
      const openRate = deliveredCount > 0 ? openCount / deliveredCount : 0;
      const clickRate = deliveredCount > 0 ? clickCount / deliveredCount : 0;
      const bounceRate = subscriberCount > 0 ? bounceCount / subscriberCount : 0;
      const unsubscribeRate = deliveredCount > 0 ? unsubscribeCount / deliveredCount : 0;

      const mappedCampaign = {
        ...campaign,
        delivery_info: {
          total: subscriberCount,
          delivery_rate: deliveryRate,
          unique_open_rate: parseFloat(statistics.uniq_open_rate) || openRate,
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
      
      console.log(`Mapped campaign ${campaign.name}, delivery_info:`, mappedCampaign.delivery_info);
      return mappedCampaign;
    });

    updateLastSyncDate(account.id).catch(error => 
      console.error(`Failed to update last sync date for account ${account.id}:`, error)
    );
    
    console.log(`Returning ${mappedCampaigns.length} mapped campaigns`);
    return mappedCampaigns;
  } catch (error) {
    console.error(`Error fetching campaigns for account ${account.id}:`, error);
    toast.error(`Erreur lors du chargement des campagnes: ${error.message || "Erreur inconnue"}`);
    return [];
  }
};
