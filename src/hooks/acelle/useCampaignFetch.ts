
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

      // Ensure all numeric fields are actually numbers
      const ensureNumeric = (value: any) => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      };

      // Create a campaign object with properly formatted statistics
      const mappedCampaign = {
        uid: campaign.campaign_uid,
        name: campaign.name || 'Unnamed Campaign',
        subject: campaign.subject || '',
        status: campaign.status || 'unknown',
        created_at: campaign.created_at || null,
        updated_at: campaign.updated_at || null,
        last_error: campaign.last_error || null,
        run_at: campaign.run_at || null,
        delivery_date: campaign.delivery_date || campaign.run_at || null,
        delivery_info: {
          ...deliveryInfo,
          total: ensureNumeric(deliveryInfo.total),
          delivered: ensureNumeric(deliveryInfo.delivered),
          opened: ensureNumeric(deliveryInfo.opened),
          clicked: ensureNumeric(deliveryInfo.clicked),
          bounced: {
            soft: ensureNumeric(deliveryInfo.bounced?.soft),
            hard: ensureNumeric(deliveryInfo.bounced?.hard),
            total: ensureNumeric(deliveryInfo.bounced?.total)
          },
          unsubscribed: ensureNumeric(deliveryInfo.unsubscribed),
          complained: ensureNumeric(deliveryInfo.complained),
          delivery_rate: ensureNumeric(deliveryInfo.delivery_rate),
          unique_open_rate: ensureNumeric(deliveryInfo.unique_open_rate),
          click_rate: ensureNumeric(deliveryInfo.click_rate),
          bounce_rate: ensureNumeric(deliveryInfo.bounce_rate),
          unsubscribe_rate: ensureNumeric(deliveryInfo.unsubscribe_rate)
        },
        statistics: {
          subscriber_count: ensureNumeric(deliveryInfo.total),
          delivered_count: ensureNumeric(deliveryInfo.delivered),
          delivered_rate: ensureNumeric(deliveryInfo.delivery_rate),
          open_count: ensureNumeric(deliveryInfo.opened),
          uniq_open_rate: ensureNumeric(deliveryInfo.unique_open_rate),
          click_count: ensureNumeric(deliveryInfo.clicked),
          click_rate: ensureNumeric(deliveryInfo.click_rate),
          bounce_count: ensureNumeric(deliveryInfo.bounced?.total),
          soft_bounce_count: ensureNumeric(deliveryInfo.bounced?.soft),
          hard_bounce_count: ensureNumeric(deliveryInfo.bounced?.hard),
          unsubscribe_count: ensureNumeric(deliveryInfo.unsubscribed),
          abuse_complaint_count: ensureNumeric(deliveryInfo.complained)
        }
      };
      
      // Recalculer les taux si nécessaire pour éviter les valeurs NaN ou invalides
      const total = mappedCampaign.delivery_info.total;
      const delivered = mappedCampaign.delivery_info.delivered;
      
      // Recalcul des taux si manquants ou invalides
      if (total > 0 && !mappedCampaign.delivery_info.delivery_rate) {
        mappedCampaign.delivery_info.delivery_rate = delivered / total;
      }
      
      if (delivered > 0) {
        if (!mappedCampaign.delivery_info.unique_open_rate) {
          mappedCampaign.delivery_info.unique_open_rate = mappedCampaign.delivery_info.opened / delivered;
        }
        if (!mappedCampaign.delivery_info.click_rate) {
          mappedCampaign.delivery_info.click_rate = mappedCampaign.delivery_info.clicked / delivered;
        }
      }
      
      if (!mappedCampaign.delivery_info.bounce_rate && total > 0) {
        mappedCampaign.delivery_info.bounce_rate = 
          mappedCampaign.delivery_info.bounced.total / total;
      }
      
      console.log(`Processed cache campaign ${campaign.name}, delivery_info:`, mappedCampaign.delivery_info);
      return mappedCampaign;
    });
    
    console.log(`Returning ${mappedCampaigns.length} processed campaigns from cache`);
    return mappedCampaigns;
  } catch (error) {
    console.error("Error in fetchCampaignsFromCache:", error);
    throw error;
  }
};
