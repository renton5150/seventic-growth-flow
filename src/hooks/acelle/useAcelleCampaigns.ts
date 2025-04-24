
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  const [activeAccounts, setActiveAccounts] = useState<AcelleAccount[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const filteredAccounts = accounts.filter(acc => acc.status === "active");
    setActiveAccounts(filteredAccounts);
  }, [accounts]);

  const fetchCampaigns = async () => {
    console.log('Fetching campaigns from cache...');
    setSyncError(null);
    
    // Sync cache first
    try {
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available");
        throw new Error("Authentication required");
      }

      console.log("Starting cache synchronization...");
      const syncResponse = await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({
          forceSync: true
        })
      });
      
      if (!syncResponse.ok) {
        let errorMessage = `Erreur ${syncResponse.status}`;
        try {
          const errorData = await syncResponse.json();
          console.error("Sync error details:", errorData);
          errorMessage += `: ${errorData.error || "Erreur de synchronisation"}`;
        } catch (e) {
          const errorText = await syncResponse.text();
          console.error(`Error syncing campaigns cache: ${syncResponse.status}`, errorText);
        }
        
        toast.error("Erreur lors de la synchronisation des campagnes");
        setSyncError(errorMessage);
      } else {
        const syncResult = await syncResponse.json();
        console.log("Sync result:", syncResult);
        
        // Vérifiez s'il y a des erreurs dans les résultats individuels
        const failedAccounts = syncResult.results?.filter((r: any) => !r.success);
        if (failedAccounts && failedAccounts.length > 0) {
          console.warn("Some accounts failed to sync:", failedAccounts);
          if (failedAccounts.length === syncResult.results.length) {
            const mainError = failedAccounts[0];
            toast.error(`Erreur de synchronisation: ${mainError.error || "Échec de connexion"}`);
            setSyncError(`Échec de la synchronisation: ${mainError.error || "Problème de connexion API"}`);
          } else {
            toast.warning(`${failedAccounts.length} compte(s) n'ont pas pu être synchronisés`);
          }
        } else {
          toast.success("Synchronisation réussie");
        }
      }
    } catch (error) {
      console.error("Error syncing campaigns cache:", error);
      toast.error("Erreur lors de la synchronisation");
      setSyncError(`Erreur: ${error.message}`);
    }

    // Get campaigns from cache with a small delay to ensure sync has time to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
      toast.error("Erreur lors du chargement des campagnes");
      throw error;
    }

    if (campaigns.length === 0) {
      console.log("No campaigns found in cache");
    } else {
      console.log(`Found ${campaigns.length} campaigns in cache`);
      console.log("Sample campaign data:", campaigns[0]);
    }

    return campaigns.map(campaign => {
      // Initialisation d'un delivery_info complet avec toutes les propriétés attendues
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
      
      // Traitement des données de delivery_info
      if (campaign.delivery_info) {
        console.log(`Processing delivery_info for campaign ${campaign.campaign_uid}:`, campaign.delivery_info);
        
        try {
          // Gestion du cas où delivery_info est une chaîne JSON
          if (typeof campaign.delivery_info === 'string') {
            try {
              const parsedInfo = JSON.parse(campaign.delivery_info);
              if (parsedInfo && typeof parsedInfo === 'object' && !Array.isArray(parsedInfo)) {
                deliveryInfo = {
                  ...deliveryInfo,
                  ...parsedInfo,
                  bounced: {
                    ...deliveryInfo.bounced,
                    ...(parsedInfo.bounced && typeof parsedInfo.bounced === 'object' ? parsedInfo.bounced : {})
                  }
                };
              }
            } catch (e) {
              console.error(`Error parsing delivery_info string for campaign ${campaign.campaign_uid}:`, e);
            }
          } 
          // Gestion du cas où delivery_info est déjà un objet
          else if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
            if (Array.isArray(campaign.delivery_info)) {
              console.error(`Unexpected array delivery_info for campaign ${campaign.campaign_uid}`);
            } else {
              deliveryInfo = {
                ...deliveryInfo,
                ...campaign.delivery_info,
                bounced: {
                  ...deliveryInfo.bounced,
                  ...(campaign.delivery_info.bounced && typeof campaign.delivery_info.bounced === 'object' 
                      ? campaign.delivery_info.bounced 
                      : {})
                }
              };
            }
          }
        } catch (e) {
          console.error(`Error processing delivery_info for campaign ${campaign.campaign_uid}:`, e);
        }
      }
      
      // Log pour vérifier les valeurs finales
      console.log(`Final deliveryInfo for campaign ${campaign.campaign_uid}:`, deliveryInfo);
      
      // Construction de l'objet campaign avec les statistiques
      const mappedCampaign: AcelleCampaign = {
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
      };

      return mappedCampaign;
    });
  };

  const { data: campaignsData = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["acelleCampaignsDashboard", activeAccounts.map(acc => acc.id)],
    queryFn: fetchCampaigns,
    enabled: activeAccounts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    activeAccounts,
    campaignsData,
    isLoading,
    isError,
    error,
    syncError,
    refetch
  };
};
