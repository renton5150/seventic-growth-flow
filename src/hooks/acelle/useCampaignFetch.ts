
import { useState } from "react";
import { toast } from "sonner";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { acelleService } from "@/services/acelle/acelle-service";

export const useCampaignFetch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const campaigns = await acelleService.getAcelleCampaigns(account);
      return campaigns;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch campaigns");
      console.error("Error fetching campaigns:", error);
      setError(error);
      toast.error(`Erreur lors du chargement des campagnes: ${error.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchCampaigns,
    isLoading,
    error
  };
};

// Add this for backward compatibility
export const fetchCampaignsFromCache = async (accountIds: string[]): Promise<AcelleCampaign[]> => {
  return [];
};
