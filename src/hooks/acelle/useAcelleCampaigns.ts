
import { useState, useEffect } from 'react';
import { AcelleAccount, AcelleCampaign, DeliveryInfo } from '@/types/acelle.types';
import { supabase } from '@/integrations/supabase/client';
import { getCampaigns } from '@/services/acelle/api/campaigns';
import { createEmptyStatistics, extractStatisticsFromAnyFormat } from '@/utils/acelle/campaignStats';

export const useAcelleCampaigns = (account: AcelleAccount | null, options?: {
  page?: number;
  perPage?: number;
  useCache?: boolean;
}) => {
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [cacheStatus, setCacheStatus] = useState<{ lastUpdated: string | null; count: number }>({
    lastUpdated: null,
    count: 0
  });

  const fetchCampaignsData = async () => {
    if (!account) {
      setCampaigns([]);
      setTotalCount(0);
      setHasMore(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useAcelleCampaigns] NOUVEAU - Récupération pour ${account.name}, useCache: ${options?.useCache}`);
      
      let fetchedCampaigns: AcelleCampaign[] = [];
      let total = 0;
      let hasMorePages = false;

      if (options?.useCache) {
        console.log(`[useAcelleCampaigns] Mode cache pour ${account.name}`);
        
        // Récupérer TOUTES les campagnes du cache
        const { data: cachedCampaigns, error: cacheError } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('account_id', account.id)
          .order('created_at', { ascending: false });

        if (cacheError) {
          console.error("[useAcelleCampaigns] Erreur cache:", cacheError);
          throw new Error("Erreur lors de la récupération du cache");
        }

        console.log(`[useAcelleCampaigns] ${cachedCampaigns?.length || 0} campagnes trouvées en cache`);

        // Conversion SIMPLE et ROBUSTE des données du cache
        fetchedCampaigns = (cachedCampaigns || []).map((item): AcelleCampaign => {
          // Extraction des statistiques depuis delivery_info
          let statistics = createEmptyStatistics();
          let deliveryInfo: DeliveryInfo = {};
          
          try {
            if (item.delivery_info && typeof item.delivery_info === 'object') {
              deliveryInfo = item.delivery_info as DeliveryInfo;
              statistics = extractStatisticsFromAnyFormat(item.delivery_info);
            }
          } catch (e) {
            console.warn(`[useAcelleCampaigns] Erreur conversion statistiques pour ${item.campaign_uid}:`, e);
          }

          return {
            uid: item.campaign_uid,
            campaign_uid: item.campaign_uid,
            name: item.name || '',
            subject: item.subject || '',
            status: item.status || '',
            created_at: item.created_at || '',
            updated_at: item.updated_at || '',
            delivery_date: item.delivery_date || '',
            run_at: item.run_at || '',
            last_error: item.last_error || '',
            delivery_info: deliveryInfo,
            statistics: statistics
          };
        });

        total = fetchedCampaigns.length;
        hasMorePages = false; // Pas de pagination en mode cache
        
        // Statut du cache
        if (cachedCampaigns && cachedCampaigns.length > 0) {
          const lastUpdated = cachedCampaigns[0].cache_updated_at;
          setCacheStatus({ lastUpdated, count: total });
        }
        
      } else {
        console.log(`[useAcelleCampaigns] Mode API pour ${account.name}`);
        
        // Récupération via API
        const result = await getCampaigns(account, options);
        fetchedCampaigns = result.campaigns;
        total = result.total;
        hasMorePages = result.hasMore;
        
        console.log(`[useAcelleCampaigns] API: ${fetchedCampaigns.length} campagnes récupérées, total: ${total}`);
      }

      setHasMore(hasMorePages);
      setTotalCount(total);
      setCampaigns(fetchedCampaigns);
      
      console.log(`[useAcelleCampaigns] ✅ ${fetchedCampaigns.length} campagnes finales pour ${account.name}`);
      
    } catch (err) {
      console.error("[useAcelleCampaigns] Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la récupération des campagnes");
      setCampaigns([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsData();
  }, [account, options?.page, options?.perPage, options?.useCache]);

  return {
    campaigns,
    isLoading,
    error,
    totalCount,
    hasMore,
    cacheStatus,
    refresh: fetchCampaignsData
  };
};
