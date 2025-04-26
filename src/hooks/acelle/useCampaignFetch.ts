
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";

export const fetchCampaignsFromCache = async (activeAccounts: AcelleAccount[]): Promise<AcelleCampaign[]> => {
  const accountIds = activeAccounts.map(acc => acc.id);
  if (accountIds.length === 0) {
    console.log("No active accounts found");
    return [];
  }

  console.log(`Fetching campaigns for accounts: ${accountIds.join(', ')}`);
  const { data: campaigns, error } = await supabase
    .from('email_campaigns_cache')
    .select('*')
    .in('account_id', accountIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }

  if (!campaigns || campaigns.length === 0) {
    console.log("No campaigns found in cache");
    return [];
  }

  console.log(`Found ${campaigns.length} campaigns in cache`);
  if (campaigns.length > 0) {
    console.log("Sample raw cached campaign data:", campaigns[0]);
  }

  const mappedCampaigns = campaigns.map(campaign => {
    // Initialize default delivery info structure
    let deliveryInfo = {
      total: 0,
      delivery_rate: 0,
      unique_open_rate: 0,
      click_rate: 0,
      bounce_rate: 0,
      unsubscribe_rate: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: {
        soft: 0,
        hard: 0,
        total: 0
      },
      unsubscribed: 0,
      complained: 0
    };

    if (campaign.delivery_info) {
      try {
        // Handle if delivery_info is a JSON string
        if (typeof campaign.delivery_info === 'string') {
          try {
            const parsedInfo = JSON.parse(campaign.delivery_info);
            console.log(`Parsed delivery_info for ${campaign.name}:`, parsedInfo);
            
            if (parsedInfo && typeof parsedInfo === 'object' && !Array.isArray(parsedInfo)) {
              deliveryInfo = {
                ...deliveryInfo,
                ...parsedInfo,
              };
              
              // Handle bounced data separately with type safety
              if (parsedInfo.bounced && typeof parsedInfo.bounced === 'object' && !Array.isArray(parsedInfo.bounced)) {
                deliveryInfo.bounced = {
                  ...deliveryInfo.bounced,
                  ...(parsedInfo.bounced as { soft?: number; hard?: number; total?: number })
                };
              }
            }
          } catch (parseError) {
            console.error(`Error parsing delivery_info string for campaign ${campaign.campaign_uid}:`, parseError);
          }
        } 
        // Handle if delivery_info is already an object
        else if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
          // Ensure we're not working with an array
          if (!Array.isArray(campaign.delivery_info)) {
            const deliveryInfoObj = campaign.delivery_info as Record<string, any>;
            console.log(`Object delivery_info for ${campaign.name}:`, deliveryInfoObj);
            
            // Copy all non-nested properties
            Object.entries(deliveryInfoObj).forEach(([key, value]) => {
              if (key !== 'bounced' && value !== null && value !== undefined) {
                (deliveryInfo as any)[key] = value;
              }
            });
            
            // Handle the nested bounced property with proper type checking
            if (deliveryInfoObj.bounced && 
                typeof deliveryInfoObj.bounced === 'object' && 
                !Array.isArray(deliveryInfoObj.bounced)) {
              deliveryInfo.bounced = {
                soft: deliveryInfoObj.bounced.soft || 0,
                hard: deliveryInfoObj.bounced.hard || 0,
                total: deliveryInfoObj.bounced.total || 0
              };
            }
          } else {
            console.warn(`Unexpected array format for delivery_info in campaign ${campaign.campaign_uid}`);
          }
        }
      } catch (e) {
        console.error(`Error processing delivery_info for campaign ${campaign.campaign_uid}:`, e);
      }
    }

    // Create a campaign object with properly formatted statistics
    const mappedCampaign = {
      uid: campaign.campaign_uid,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      last_error: campaign.last_error,
      run_at: campaign.run_at,
      delivery_date: campaign.delivery_date,
      delivery_info: deliveryInfo,
      statistics: {
        subscriber_count: deliveryInfo.total || 0,
        delivered_count: deliveryInfo.delivered || 0,
        delivered_rate: deliveryInfo.delivery_rate || 0,
        open_count: deliveryInfo.opened || 0,
        uniq_open_rate: deliveryInfo.unique_open_rate || 0,
        click_count: deliveryInfo.clicked || 0,
        click_rate: deliveryInfo.click_rate || 0,
        bounce_count: deliveryInfo.bounced?.total || 0,
        soft_bounce_count: deliveryInfo.bounced?.soft || 0,
        hard_bounce_count: deliveryInfo.bounced?.hard || 0,
        unsubscribe_count: deliveryInfo.unsubscribed || 0,
        abuse_complaint_count: deliveryInfo.complained || 0
      }
    };
    
    console.log(`Processed cache campaign ${campaign.name}, delivery_info:`, mappedCampaign.delivery_info);
    return mappedCampaign;
  });
  
  console.log(`Returning ${mappedCampaigns.length} processed campaigns from cache`);
  return mappedCampaigns;
};
