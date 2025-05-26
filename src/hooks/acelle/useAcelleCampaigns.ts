
import { useState, useEffect } from 'react';
import { AcelleAccount, AcelleCampaign, DeliveryInfo } from '@/types/acelle.types';
import { supabase } from '@/integrations/supabase/client';
import { getCampaigns } from '@/services/acelle/api/campaigns';
import { createEmptyStatistics } from '@/utils/acelle/campaignStats';

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
      console.log(`[useAcelleCampaigns] ROBUSTE - Récupération pour ${account.name}, useCache: ${options?.useCache}`);
      
      let fetchedCampaigns: AcelleCampaign[] = [];
      let total = 0;
      let hasMorePages = false;

      if (options?.useCache) {
        console.log(`[useAcelleCampaigns] ROBUSTE - Mode cache pour ${account.name}`);
        
        // Récupérer TOUTES les campagnes du cache
        const { data: cachedCampaigns, error: cacheError } = await supabase
          .from('email_campaigns_cache')
          .select('*')
          .eq('account_id', account.id)
          .order('created_at', { ascending: false });

        if (cacheError) {
          console.error("[useAcelleCampaigns] ROBUSTE - Erreur cache:", cacheError);
          throw new Error("Erreur lors de la récupération du cache");
        }

        console.log(`[useAcelleCampaigns] ROBUSTE - ${cachedCampaigns?.length || 0} campagnes trouvées en cache`);

        // Conversion robuste des données du cache
        fetchedCampaigns = (cachedCampaigns || []).map((item): AcelleCampaign => {
          // Helper robuste pour extraire des valeurs numériques de delivery_info
          const getStatValue = (path: string, defaultValue: number = 0): number => {
            try {
              if (!item.delivery_info || typeof item.delivery_info !== 'object') return defaultValue;
              
              const value = (item.delivery_info as any)[path];
              if (value === null || value === undefined || value === '') return defaultValue;
              
              const numValue = typeof value === 'number' ? value : parseFloat(String(value));
              return isNaN(numValue) ? defaultValue : numValue;
            } catch (e) {
              return defaultValue;
            }
          };

          // Créer les statistiques complètes depuis delivery_info
          const statistics = {
            subscriber_count: getStatValue('subscriber_count') || getStatValue('total'),
            delivered_count: getStatValue('delivered_count') || getStatValue('delivered'),
            delivered_rate: getStatValue('delivered_rate') || getStatValue('delivery_rate'),
            open_count: getStatValue('open_count') || getStatValue('opened'),
            uniq_open_count: getStatValue('uniq_open_count') || getStatValue('opened'),
            uniq_open_rate: getStatValue('uniq_open_rate') || getStatValue('unique_open_rate') || getStatValue('open_rate'),
            click_count: getStatValue('click_count') || getStatValue('clicked'),
            click_rate: getStatValue('click_rate'),
            bounce_count: getStatValue('bounce_count') || getStatValue('bounced.total') || getStatValue('bounced'),
            soft_bounce_count: getStatValue('soft_bounce_count') || getStatValue('bounced.soft'),
            hard_bounce_count: getStatValue('hard_bounce_count') || getStatValue('bounced.hard'),
            unsubscribe_count: getStatValue('unsubscribe_count') || getStatValue('unsubscribed'),
            abuse_complaint_count: getStatValue('abuse_complaint_count') || getStatValue('complained')
          };

          // Conversion robuste de delivery_info vers DeliveryInfo type
          let deliveryInfo: DeliveryInfo = {};
          try {
            if (item.delivery_info && typeof item.delivery_info === 'object' && !Array.isArray(item.delivery_info)) {
              deliveryInfo = item.delivery_info as DeliveryInfo;
            }
          } catch (e) {
            console.warn(`[useAcelleCampaigns] ROBUSTE - Erreur conversion delivery_info pour ${item.campaign_uid}:`, e);
            deliveryInfo = {};
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
        hasMorePages = false; // Pas de pagination en mode cache - on récupère tout
        
        // Statut du cache
        if (cachedCampaigns && cachedCampaigns.length > 0) {
          const lastUpdated = cachedCampaigns[0].cache_updated_at;
          setCacheStatus({ lastUpdated, count: total });
        }
        
      } else {
        console.log(`[useAcelleCampaigns] ROBUSTE - Mode API pour ${account.name}`);
        
        // Récupération via API avec pagination robuste
        const result = await getCampaigns(account, options);
        fetchedCampaigns = result.campaigns;
        total = result.total;
        hasMorePages = result.hasMore;
        
        console.log(`[useAcelleCampaigns] ROBUSTE - API: ${fetchedCampaigns.length} campagnes récupérées, total: ${total}`);
      }

      setHasMore(hasMorePages);
      setTotalCount(total);
      setCampaigns(fetchedCampaigns);
      
      console.log(`[useAcelleCampaigns] ROBUSTE - ${fetchedCampaigns.length} campagnes finales pour ${account.name}`);
      
    } catch (err) {
      console.error("[useAcelleCampaigns] ROBUSTE - Erreur:", err);
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
