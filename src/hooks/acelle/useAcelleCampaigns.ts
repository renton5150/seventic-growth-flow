
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";

export const useAcelleCampaigns = (accounts: AcelleAccount[]) => {
  const [activeAccounts, setActiveAccounts] = useState<AcelleAccount[]>([]);
  const [campaignsData, setCampaignsData] = useState<AcelleCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filteredAccounts = accounts.filter(acc => acc.status === "active");
    setActiveAccounts(filteredAccounts);
  }, [accounts]);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const results: AcelleCampaign[] = [];
    
    // Limit to max 5 campaigns per account for dashboard to improve performance
    const campaignsPerAccount = 5; 
    
    for (const account of activeAccounts) {
      try {
        console.log(`Fetching campaigns for account: ${account.name}`);
        const campaigns = await acelleService.getAcelleCampaigns(account, 1, campaignsPerAccount);
        console.log(`Got ${campaigns.length} campaigns for ${account.name}`);
        results.push(...campaigns);
      } catch (error) {
        console.error(`Erreur lors de la récupération des campagnes pour ${account.name}:`, error);
      }
    }
    
    setLoading(false);
    return results;
  }, [activeAccounts]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["acelleCampaignsDashboard", activeAccounts.map(acc => acc.id)],
    queryFn: fetchCampaigns,
    enabled: activeAccounts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setCampaignsData(data);
    }
  }, [data]);

  return {
    activeAccounts,
    campaignsData,
    isLoading: isLoading || loading,
    isError,
    refetch
  };
};
