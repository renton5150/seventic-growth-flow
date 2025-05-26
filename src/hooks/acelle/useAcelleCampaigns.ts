
import { useState, useEffect } from 'react';
import { AcelleAccount, AcelleCampaign } from '@/types/acelle.types';
import { supabase } from '@/integrations/supabase/client';
import { getCampaigns, extractCampaignsFromCache, getCacheStatus } from '@/services/acelle/api/campaigns';
import { enrichCampaignsWithStats } from '@/services/acelle/api/stats/directStats';

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
      console.log(`[useAcelleCampaigns] Récupération pour ${account.name}, useCache: ${options?.useCache}`);
      
      let fetchedCampaigns: AcelleCampaign[] = [];
      let total = 0;
      let hasMorePages = false;

      if (options?.useCache) {
        console.log(`[useAcelleCampaigns] Mode cache activé pour ${account.name}`);
        
        // Récupérer TOUTES les campagnes du cache sans pagination
        const { data: allCachedCampaigns, error: cacheError } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('account_id', account.id)
          .order('created_at', { ascending: false });

        if (cacheError) {
          console.error("[useAcelleCampaigns] Erreur cache:", cacheError);
          throw new Error("Erreur lors de la récupération du cache");
        }

        console.log(`[useAcelleCampaigns] ${allCachedCampaigns?.length || 0} campagnes trouvées en cache`);

        // Convertir les données du cache au format AcelleCampaign
        fetchedCampaigns = (allCachedCampaigns || []).map((item): AcelleCampaign => {
          let deliveryInfo = {};
          try {
            deliveryInfo = typeof item.delivery_info === 'string' 
              ? JSON.parse(item.delivery_info) 
              : item.delivery_info || {};
          } catch (e) {
            console.warn(`[useAcelleCampaigns] Erreur parsing delivery_info pour ${item.campaign_uid}:`, e);
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
            statistics: {
              subscriber_count: Number(deliveryInfo.subscriber_count || 0),
              delivered_count: Number(deliveryInfo.delivered_count || 0),
              delivered_rate: Number(deliveryInfo.delivered_rate || 0),
              open_count: Number(deliveryInfo.open_count || 0),
              uniq_open_count: Number(deliveryInfo.uniq_open_count || 0),
              uniq_open_rate: Number(deliveryInfo.uniq_open_rate || 0),
              click_count: Number(deliveryInfo.click_count || 0),
              click_rate: Number(deliveryInfo.click_rate || 0),
              bounce_count: Number(deliveryInfo.bounce_count || 0),
              soft_bounce_count: Number(deliveryInfo.soft_bounce_count || 0),
              hard_bounce_count: Number(deliveryInfo.hard_bounce_count || 0),
              unsubscribe_count: Number(deliveryInfo.unsubscribe_count || 0),
              abuse_complaint_count: Number(deliveryInfo.abuse_complaint_count || 0)
            }
          };
        });

        total = fetchedCampaigns.length;
        
        // Appliquer la pagination côté client si nécessaire
        if (options?.page && options?.perPage) {
          const startIndex = (options.page - 1) * options.perPage;
          const endIndex = startIndex + options.perPage;
          const paginatedCampaigns = fetchedCampaigns.slice(startIndex, endIndex);
          
          hasMorePages = endIndex < total;
          fetchedCampaigns = paginatedCampaigns;
          
          console.log(`[useAcelleCampaigns] Pagination: page ${options.page}, showing ${paginatedCampaigns.length}/${total} campaigns`);
        } else {
          hasMorePages = false;
          console.log(`[useAcelleCampaigns] Pas de pagination, affichage de toutes les ${total} campagnes`);
        }

        // Récupérer le statut du cache
        const status = await getCacheStatus(account.id);
        setCacheStatus(status);
        
      } else {
        console.log(`[useAcelleCampaigns] Mode API pour ${account.name}`);
        
        // Fetch campaigns from API with proper pagination
        const result = await getCampaigns(account, options);
        fetchedCampaigns = result.campaigns;
        total = result.total;
        hasMorePages = result.hasMore;
        
        console.log(`[useAcelleCampaigns] API: ${fetchedCampaigns.length} campagnes récupérées, total: ${total}`);
      }

      setHasMore(hasMorePages);
      setTotalCount(total);

      // Enrichir les campagnes avec les statistiques si nécessaire
      console.log(`[useAcelleCampaigns] Enrichissement de ${fetchedCampaigns.length} campagnes...`);
      const enrichedCampaigns = await enrichCampaignsWithStats(fetchedCampaigns, account);
      setCampaigns(enrichedCampaigns);
      
      console.log(`[useAcelleCampaigns] ${enrichedCampaigns.length} campagnes finales pour ${account.name}`);
      
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
