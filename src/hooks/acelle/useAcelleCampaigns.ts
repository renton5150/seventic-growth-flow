import { useState, useEffect } from 'react';
import { AcelleAccount, AcelleCampaign } from '@/types/acelle.types';
import { supabase } from '@/integrations/supabase/client';
import { getCampaigns, extractCampaignsFromCache, getCacheStatus } from '@/services/acelle/api/campaigns';
import { enrichCampaignsWithStats } from '@/services/acelle/api/stats/campaignStats';

export const useAcelleCampaigns = (account: AcelleAccount | null, options?: {
  page?: number;
  perPage?: number;
  useCache?: boolean;
}) => {
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [cacheStatus, setCacheStatus] = useState<{ lastUpdated: string | null; count: number }>({
    lastUpdated: null,
    count: 0
  });

  const fetchCampaignsData = async () => {
    if (!account) {
      setCampaigns([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let fetchedCampaigns: AcelleCampaign[] = [];

      if (options?.useCache) {
        // Fetch campaigns from cache
        const campaignsFromCache = await extractCampaignsFromCache(account.id, options);
        fetchedCampaigns = campaignsFromCache;

        // Fetch cache status
        const status = await getCacheStatus(account.id);
        setCacheStatus(status);
        setTotalCount(status.count);
      } else {
        // Fetch campaigns from API
        const campaignsFromApi = await getCampaigns(account, options);
        fetchedCampaigns = campaignsFromApi;
        setTotalCount(campaignsFromApi.length);
      }

      // Enrich campaigns with statistics
      const enrichedCampaigns = await enrichCampaignsWithStats(fetchedCampaigns, account);
      setCampaigns(enrichedCampaigns);
    } catch (err) {
      console.error("Erreur lors de la récupération des campagnes:", err);
      setError("Erreur lors de la récupération des campagnes");
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
    cacheStatus,
    refresh: fetchCampaignsData
  };
};
