
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";

/**
 * Fetch campaigns from cache for given accounts
 */
export const fetchCampaignsFromCache = async (accounts: AcelleAccount[]): Promise<AcelleCampaign[]> => {
  try {
    if (!accounts || accounts.length === 0) {
      console.log('No accounts provided to fetch campaigns from cache');
      return [];
    }
    
    console.log(`Fetching cached campaigns for ${accounts.length} accounts`);
    
    // Get account IDs
    const accountIds = accounts.map(account => account.id);
    
    // Fetch campaigns from cache
    const { data: cachedCampaigns, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching campaigns from cache:', error);
      return [];
    }
    
    if (!cachedCampaigns || cachedCampaigns.length === 0) {
      console.log('No cached campaigns found');
      return [];
    }
    
    console.log(`Found ${cachedCampaigns.length} cached campaigns`);
    
    // Convert cache format to AcelleCampaign format
    return cachedCampaigns.map(campaign => {
      // Handle delivery_info parsing if needed
      let deliveryInfo = campaign.delivery_info || {};
      if (typeof deliveryInfo === 'string') {
        try {
          deliveryInfo = JSON.parse(deliveryInfo);
        } catch (e) {
          console.warn('Error parsing delivery_info JSON:', e);
          deliveryInfo = {};
        }
      }
      
      // Ensure bounced object exists
      if (!deliveryInfo.bounced) {
        deliveryInfo.bounced = {
          soft: 0,
          hard: 0,
          total: 0
        };
      }
      
      // Create statistics from delivery_info
      const statistics = {
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
      };
      
      // Return consistent AcelleCampaign format
      return {
        uid: campaign.campaign_uid,
        campaign_uid: campaign.campaign_uid,
        name: campaign.name || '',
        subject: campaign.subject || '',
        status: campaign.status || '',
        created_at: campaign.created_at || '',
        updated_at: campaign.updated_at || '',
        delivery_date: campaign.delivery_date || '',
        run_at: campaign.run_at || '',
        last_error: campaign.last_error || '',
        delivery_info: deliveryInfo,
        statistics
      } as AcelleCampaign;
    });
  } catch (error) {
    console.error('Error in fetchCampaignsFromCache:', error);
    return [];
  }
};
