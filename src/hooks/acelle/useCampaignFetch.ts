
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";

export const fetchCampaignsFromCache = async (activeAccounts: AcelleAccount[]): Promise<AcelleCampaign[]> => {
  const accountIds = activeAccounts.map(acc => acc.id);
  if (accountIds.length === 0) {
    console.log("No active accounts found");
    return [];
  }

  console.log(`Fetching campaigns for accounts: ${accountIds.join(', ')}`);
  
  try {
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
    // Only log detailed sample data in development
    if (process.env.NODE_ENV !== 'production' && campaigns.length > 0) {
      console.log("Sample campaign data:", campaigns[0]);
    }

    return campaigns.map(campaign => {
      // Initialize default values for missing stats
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

      // Try to safely extract delivery info
      if (campaign.delivery_info) {
        try {
          // Handle if delivery_info is a JSON string
          if (typeof campaign.delivery_info === 'string') {
            try {
              const parsedInfo = JSON.parse(campaign.delivery_info);
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
              console.error(`Error parsing delivery_info JSON for campaign ${campaign.campaign_uid}:`, parseError);
            }
          } 
          // Handle if delivery_info is already an object
          else if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
            // Ensure we're not working with an array
            if (!Array.isArray(campaign.delivery_info)) {
              const deliveryInfoObj = campaign.delivery_info as Record<string, any>;
              
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

      // Try to extract statistics if available, falling back to delivery_info values
      const statistics = {
        subscriber_count: getNumberSafely(campaign, ['statistics', 'subscriber_count'], deliveryInfo.total),
        delivered_count: getNumberSafely(campaign, ['statistics', 'delivered_count'], deliveryInfo.delivered),
        delivered_rate: getNumberSafely(campaign, ['statistics', 'delivered_rate'], deliveryInfo.delivery_rate),
        open_count: getNumberSafely(campaign, ['statistics', 'open_count'], deliveryInfo.opened),
        uniq_open_rate: getNumberSafely(campaign, ['statistics', 'uniq_open_rate'], deliveryInfo.unique_open_rate),
        click_count: getNumberSafely(campaign, ['statistics', 'click_count'], deliveryInfo.clicked),
        click_rate: getNumberSafely(campaign, ['statistics', 'click_rate'], deliveryInfo.click_rate),
        bounce_count: getNumberSafely(campaign, ['statistics', 'bounce_count'], deliveryInfo.bounced.total),
        soft_bounce_count: getNumberSafely(campaign, ['statistics', 'soft_bounce_count'], deliveryInfo.bounced.soft),
        hard_bounce_count: getNumberSafely(campaign, ['statistics', 'hard_bounce_count'], deliveryInfo.bounced.hard),
        unsubscribe_count: getNumberSafely(campaign, ['statistics', 'unsubscribe_count'], deliveryInfo.unsubscribed),
        abuse_complaint_count: getNumberSafely(campaign, ['statistics', 'abuse_complaint_count'], deliveryInfo.complained)
      };

      // Create final campaign object
      return {
        uid: campaign.campaign_uid,
        name: campaign.name || 'Sans nom',
        subject: campaign.subject || 'Sans sujet',
        status: campaign.status || 'unknown',
        created_at: campaign.created_at,
        updated_at: campaign.updated_at,
        last_error: campaign.last_error,
        run_at: campaign.run_at,
        delivery_date: campaign.delivery_date || campaign.run_at,
        delivery_info: deliveryInfo,
        statistics: statistics,
        meta: {} // Use empty object as default
      };
    });
  } catch (error) {
    console.error('Fatal error fetching campaigns from cache:', error);
    return [];
  }
};

// Helper function to safely extract nested values
function getNumberSafely(obj: any, path: string[], defaultValue: number = 0): number {
  try {
    let current = obj;
    for (const key of path) {
      if (current === undefined || current === null) return defaultValue;
      current = current[key];
    }
    if (current === undefined || current === null) return defaultValue;
    const num = Number(current);
    return isNaN(num) ? defaultValue : num;
  } catch (e) {
    return defaultValue;
  }
}
