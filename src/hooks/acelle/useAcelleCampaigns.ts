import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  const [activeAccounts, setActiveAccounts] = useState<AcelleAccount[]>([]);

  useEffect(() => {
    const filteredAccounts = accounts.filter(acc => acc.status === "active");
    setActiveAccounts(filteredAccounts);
  }, [accounts]);

  const fetchCampaigns = async () => {
    console.log('Fetching campaigns from cache...');
    
    // Sync cache first
    try {
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available");
        throw new Error("Authentication required");
      }

      await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
    } catch (error) {
      console.error("Error syncing campaigns cache:", error);
      // Continue to get cached data even if sync fails
    }

    // Get campaigns from cache
    const accountIds = activeAccounts.map(acc => acc.id);
    const { data: campaigns, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }

    return campaigns.map(campaign => {
      // Initialize default empty objects with all required properties
      let deliveryInfo = {
        total: 0,
        delivered: 0,
        delivery_rate: 0,
        opened: 0,
        unique_open_rate: 0,
        clicked: 0,
        click_rate: 0,
        bounced: {
          soft: 0,
          hard: 0,
          total: 0
        },
        unsubscribed: 0,
        complained: 0
      };
      
      // Parse the delivery_info if it's a string or use the object if available
      try {
        if (typeof campaign.delivery_info === 'string') {
          const parsedInfo = JSON.parse(campaign.delivery_info);
          if (parsedInfo && typeof parsedInfo === 'object') {
            // Merge with defaults to ensure all properties exist
            deliveryInfo = {
              ...deliveryInfo,
              ...parsedInfo,
              bounced: {
                ...deliveryInfo.bounced,
                ...(parsedInfo.bounced || {})
              }
            };
          }
        } else if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
          // Merge with defaults to ensure all properties exist
          deliveryInfo = {
            ...deliveryInfo,
            ...campaign.delivery_info,
            bounced: {
              ...deliveryInfo.bounced,
              ...(campaign.delivery_info.bounced || {})
            }
          };
        }
      } catch (e) {
        console.error('Error parsing delivery_info:', e);
        // Keep using the default deliveryInfo object
      }
      
      return {
        ...campaign,
        uid: campaign.campaign_uid,
        delivery_at: campaign.delivery_date,
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
        },
        delivery_info: {
          total: deliveryInfo.total || 0,
          delivery_rate: deliveryInfo.delivery_rate || 0,
          unique_open_rate: deliveryInfo.unique_open_rate || 0,
          click_rate: deliveryInfo.click_rate || 0,
          bounce_rate: deliveryInfo.bounced?.total ? deliveryInfo.bounced.total / (deliveryInfo.total || 1) : 0,
          unsubscribe_rate: deliveryInfo.unsubscribed ? deliveryInfo.unsubscribed / (deliveryInfo.total || 1) : 0,
          delivered: deliveryInfo.delivered || 0,
          opened: deliveryInfo.opened || 0,
          clicked: deliveryInfo.clicked || 0,
          bounced: {
            soft: deliveryInfo.bounced?.soft || 0,
            hard: deliveryInfo.bounced?.hard || 0,
            total: deliveryInfo.bounced?.total || 0
          },
          unsubscribed: deliveryInfo.unsubscribed || 0,
          complained: deliveryInfo.complained || 0
        }
      } as AcelleCampaign;
    });
  };

  const { data: campaignsData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["acelleCampaignsDashboard", activeAccounts.map(acc => acc.id)],
    queryFn: fetchCampaigns,
    enabled: activeAccounts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    activeAccounts,
    campaignsData,
    isLoading,
    isError,
    refetch
  };
};
