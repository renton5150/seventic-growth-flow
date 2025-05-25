
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
      let fetchedCampaigns: AcelleCampaign[] = [];
      let total = 0;
      let hasMorePages = false;

      if (options?.useCache) {
        // Fetch campaigns from cache
        const campaignsFromCache = await extractCampaignsFromCache(account.id, options);
        fetchedCampaigns = campaignsFromCache;

        // Fetch cache status
        const status = await getCacheStatus(account.id);
        setCacheStatus(status);
        setTotalCount(status.count);
        
        // Calculate if there are more pages in cache
        const currentPage = options?.page || 1;
        const perPage = options?.perPage || 10;
        hasMorePages = (currentPage * perPage) < status.count;
      } else {
        // Fetch campaigns from API with proper pagination
        const result = await getCampaigns(account, options);
        fetchedCampaigns = result.campaigns;
        total = result.total;
        hasMorePages = result.hasMore;
        setTotalCount(total);
      }

      setHasMore(hasMorePages);

      // Enrich campaigns with statistics
      const enrichedCampaigns = await enrichCampaignsWithStats(fetchedCampaigns, account);
      setCampaigns(enrichedCampaigns);
    } catch (err) {
      console.error("Erreur lors de la récupération des campagnes:", err);
      setError("Erreur lors de la récupération des campagnes");
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
