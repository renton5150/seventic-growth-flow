
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Fetch campaigns from cache for given accounts
 */
export const fetchCampaignsFromCache = async (
  accounts: AcelleAccount[],
  page: number = 1,
  perPage: number = 5,
  skipPagination: boolean = false
): Promise<AcelleCampaign[]> => {
  try {
    if (!accounts || accounts.length === 0) {
      console.log('No accounts provided to fetch campaigns from cache');
      return [];
    }
    
    console.log(`Fetching cached campaigns for ${accounts.length} accounts`);
    
    // Get account IDs
    const accountIds = accounts.map(account => account.id);
    
    let query = supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false });
    
    // Apply pagination only if not skipped
    if (!skipPagination) {
      // Calculate pagination
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage - 1;
      query = query.range(startIndex, endIndex);
    }
    
    // Execute the query
    const { data: cachedCampaigns, error } = await query;
      
    if (error) {
      console.error('Error fetching campaigns from cache:', error);
      return [];
    }
    
    if (!cachedCampaigns || cachedCampaigns.length === 0) {
      console.log('No cached campaigns found');
      return [];
    }
    
    console.log(`Found ${cachedCampaigns.length} cached campaigns`);
    console.log('Sample cached campaign data:', cachedCampaigns[0]);
    
    // Convert cache format to AcelleCampaign format
    return cachedCampaigns.map(campaign => {
      // Handle delivery_info parsing with improved error handling
      let deliveryInfo: Record<string, any> = {};
      
      if (campaign.delivery_info) {
        // Convert string to object if needed
        if (typeof campaign.delivery_info === 'string') {
          try {
            deliveryInfo = JSON.parse(campaign.delivery_info);
          } catch (e) {
            console.warn('Error parsing delivery_info JSON:', e);
            deliveryInfo = {};
          }
        } else if (typeof campaign.delivery_info === 'object') {
          // It's already an object
          deliveryInfo = campaign.delivery_info as Record<string, any>;
        }
      }
      
      // Log the extracted delivery info for debugging
      console.log(`Delivery info extracted for ${campaign.name}:`, deliveryInfo);
      
      // Ensure bounced object exists with proper type safety
      const bouncedInfo = (
        deliveryInfo && 
        typeof deliveryInfo === 'object' && 
        deliveryInfo.bounced && 
        typeof deliveryInfo.bounced === 'object'
      ) ? deliveryInfo.bounced : { soft: 0, hard: 0, total: 0 };
      
      // Create statistics from delivery_info with safe type access and ensure all required properties exist
      const statistics: AcelleCampaignStatistics = {
        subscriber_count: typeof deliveryInfo.total === 'number' ? deliveryInfo.total : 0,
        delivered_count: typeof deliveryInfo.delivered === 'number' ? deliveryInfo.delivered : 0,
        delivered_rate: typeof deliveryInfo.delivery_rate === 'number' ? deliveryInfo.delivery_rate : 0,
        open_count: typeof deliveryInfo.opened === 'number' ? deliveryInfo.opened : 0,
        open_rate: typeof deliveryInfo.open_rate === 'number' ? deliveryInfo.open_rate : 0,
        uniq_open_rate: typeof deliveryInfo.unique_open_rate === 'number' ? deliveryInfo.unique_open_rate : 0,
        click_count: typeof deliveryInfo.clicked === 'number' ? deliveryInfo.clicked : 0,
        click_rate: typeof deliveryInfo.click_rate === 'number' ? deliveryInfo.click_rate : 0,
        bounce_count: typeof bouncedInfo.total === 'number' ? bouncedInfo.total : 0,
        soft_bounce_count: typeof bouncedInfo.soft === 'number' ? bouncedInfo.soft : 0,
        hard_bounce_count: typeof bouncedInfo.hard === 'number' ? bouncedInfo.hard : 0,
        unsubscribe_count: typeof deliveryInfo.unsubscribed === 'number' ? deliveryInfo.unsubscribed : 0,
        abuse_complaint_count: typeof deliveryInfo.complained === 'number' ? deliveryInfo.complained : 0
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

/**
 * Fetch a single campaign by its UID
 */
export const fetchCampaignById = async (
  campaignUid: string,
  accountId: string
): Promise<AcelleCampaign | null> => {
  try {
    console.log(`Fetching campaign ${campaignUid} for account ${accountId}`);
    
    // Execute the query
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId)
      .single();
      
    if (error) {
      console.error('Error fetching campaign by ID:', error);
      return null;
    }
    
    if (!data) {
      console.log('No campaign found with the given ID');
      return null;
    }
    
    console.log(`Found campaign: ${data.name}`);
    
    // Convert database record to AcelleCampaign format (same logic as in fetchCampaignsFromCache)
    let deliveryInfo: Record<string, any> = {};
    
    if (data.delivery_info) {
      if (typeof data.delivery_info === 'string') {
        try {
          deliveryInfo = JSON.parse(data.delivery_info);
        } catch (e) {
          console.warn('Error parsing delivery_info JSON:', e);
          deliveryInfo = {};
        }
      } else if (typeof data.delivery_info === 'object') {
        deliveryInfo = data.delivery_info as Record<string, any>;
      }
    }
    
    const bouncedInfo = (
      deliveryInfo && 
      typeof deliveryInfo === 'object' && 
      deliveryInfo.bounced && 
      typeof deliveryInfo.bounced === 'object'
    ) ? deliveryInfo.bounced : { soft: 0, hard: 0, total: 0 };
    
    const statistics: AcelleCampaignStatistics = {
      subscriber_count: typeof deliveryInfo.total === 'number' ? deliveryInfo.total : 0,
      delivered_count: typeof deliveryInfo.delivered === 'number' ? deliveryInfo.delivered : 0,
      delivered_rate: typeof deliveryInfo.delivery_rate === 'number' ? deliveryInfo.delivery_rate : 0,
      open_count: typeof deliveryInfo.opened === 'number' ? deliveryInfo.opened : 0,
      uniq_open_rate: typeof deliveryInfo.unique_open_rate === 'number' ? deliveryInfo.unique_open_rate : 0,
      click_count: typeof deliveryInfo.clicked === 'number' ? deliveryInfo.clicked : 0,
      click_rate: typeof deliveryInfo.click_rate === 'number' ? deliveryInfo.click_rate : 0,
      bounce_count: typeof bouncedInfo.total === 'number' ? bouncedInfo.total : 0,
      soft_bounce_count: typeof bouncedInfo.soft === 'number' ? bouncedInfo.soft : 0,
      hard_bounce_count: typeof bouncedInfo.hard === 'number' ? bouncedInfo.hard : 0,
      unsubscribe_count: typeof deliveryInfo.unsubscribed === 'number' ? deliveryInfo.unsubscribed : 0,
      abuse_complaint_count: typeof deliveryInfo.complained === 'number' ? deliveryInfo.complained : 0
    };
    
    return {
      uid: data.campaign_uid,
      campaign_uid: data.campaign_uid,
      name: data.name || '',
      subject: data.subject || '',
      status: data.status || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      delivery_date: data.delivery_date || '',
      run_at: data.run_at || '',
      last_error: data.last_error || '',
      delivery_info: deliveryInfo,
      statistics
    } as AcelleCampaign;
  } catch (error) {
    console.error('Error in fetchCampaignById:', error);
    return null;
  }
};
