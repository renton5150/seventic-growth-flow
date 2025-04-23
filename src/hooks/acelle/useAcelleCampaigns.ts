
import { useState, useEffect } from "react";
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["acelleCampaignsDashboard", activeAccounts.map(acc => acc.id)],
    queryFn: async () => {
      setLoading(true);
      const results: AcelleCampaign[] = [];
      
      for (const account of activeAccounts) {
        try {
          console.log(`Fetching campaigns for account: ${account.name}`);
          const campaigns = await acelleService.getAcelleCampaigns(account);
          console.log(`Got ${campaigns.length} campaigns for ${account.name}`, campaigns);
          results.push(...campaigns);
        } catch (error) {
          console.error(`Erreur lors de la récupération des campagnes pour ${account.name}:`, error);
        }
      }
      
      setLoading(false);
      return results;
    },
    enabled: activeAccounts.length > 0,
  });

  useEffect(() => {
    if (data) {
      console.log("Setting campaigns data:", data);
      setCampaignsData(data);
    }
  }, [data]);

  return {
    activeAccounts,
    campaignsData,
    isLoading: isLoading || loading,
    isError
  };
};
