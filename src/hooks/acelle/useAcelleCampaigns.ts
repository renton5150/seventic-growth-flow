
import { useState, useEffect, useCallback } from "react";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { getAcelleCampaigns, getCacheStatus } from "@/services/acelle/api/campaigns";
import { supabase } from "@/integrations/supabase/client";
import { useAuthToken } from "./useAuthToken";

interface UseAcelleCampaignsProps {
  account: AcelleAccount;
  paginationEnabled?: boolean;
  itemsPerPage?: number;
  autoLoad?: boolean;
}

interface UseCampaignsReturn {
  campaigns: AcelleCampaign[];
  isLoading: boolean;
  error: Error | null;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  fetchCampaignDetails: (campaignUid: string) => Promise<any>;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  refetchCount: number;
  isFetching: boolean;
}

export const useAcelleCampaigns = ({
  account,
  paginationEnabled = true,
  itemsPerPage = 10,
  autoLoad = true,
}: UseAcelleCampaignsProps): UseCampaignsReturn => {
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<AcelleCampaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [refetchCount, setRefetchCount] = useState<number>(0);

  const { authToken, getValidAuthToken } = useAuthToken();

  // Calculer les campagnes à afficher en fonction de la pagination
  useEffect(() => {
    if (!paginationEnabled) {
      setCampaigns(allCampaigns);
      return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCampaigns = allCampaigns.slice(startIndex, endIndex);
    setCampaigns(paginatedCampaigns);

    // Mettre à jour le nombre total de pages
    const totalItems = allCampaigns.length;
    const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    setTotalPages(calculatedTotalPages);
  }, [allCampaigns, currentPage, itemsPerPage, paginationEnabled]);

  // Fonction pour rafraîchir les données
  const refresh = useCallback(
    async (forceRefresh = false) => {
      if (!account?.id) {
        setAllCampaigns([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsFetching(true);
        if (isLoading) setIsLoading(true);
        setError(null);

        const campaigns = await getAcelleCampaigns(account, {
          refresh: forceRefresh
        });

        setAllCampaigns(campaigns);
        setRefetchCount((prev) => prev + 1);
      } catch (err) {
        console.error("Erreur lors de la récupération des campagnes:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    },
    [account]
  );

  // Récupération des données au chargement
  useEffect(() => {
    if (autoLoad && account?.id) {
      refresh(false);
    }
  }, [account?.id, autoLoad, refresh]);

  const fetchCampaignDetails = useCallback(
    async (campaignUid: string) => {
      try {
        setIsFetching(true);
        
        // Fonction à implémenter plus tard
        return null;
      } catch (err) {
        console.error(
          `Erreur lors de la récupération des détails de la campagne ${campaignUid}:`,
          err
        );
        throw err;
      } finally {
        setIsFetching(false);
      }
    },
    [account]
  );

  // Navigation pagination
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  return {
    campaigns,
    isLoading,
    error,
    refresh,
    currentPage,
    setCurrentPage,
    totalPages,
    fetchCampaignDetails,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToNextPage,
    goToPreviousPage,
    refetchCount,
    isFetching,
  };
};

// Fetch campaigns from cache fonction
export const fetchCampaignsFromCache = async (
  accounts: AcelleAccount[],
  page: number = 1,
  pageSize: number = 10
): Promise<AcelleCampaign[]> => {
  if (!accounts || accounts.length === 0) {
    console.log("Aucun compte fourni pour la récupération du cache");
    return [];
  }

  try {
    const accountIds = accounts.map(account => account.id);
    
    // Calculer l'offset pour la pagination
    const offset = (page - 1) * pageSize;
    
    // Récupérer les campagnes mises en cache
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transformer les données en AcelleCampaign[]
    const campaigns = data.map(item => ({
      uid: item.campaign_uid,
      campaign_uid: item.campaign_uid,
      name: item.name || '',
      subject: item.subject || '',
      status: item.status || '',
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      delivery_date: item.delivery_date || '',
      run_at: item.run_at || '',
      last_error: item.last_error,
      delivery_info: typeof item.delivery_info === 'string' 
        ? JSON.parse(item.delivery_info) 
        : (item.delivery_info || {})
    })) as AcelleCampaign[];
    
    return campaigns;
  } catch (error) {
    console.error("Erreur lors de la récupération des campagnes depuis le cache:", error);
    return [];
  }
};
