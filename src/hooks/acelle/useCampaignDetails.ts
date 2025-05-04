
import { useState, useEffect } from "react";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { fetchCampaignById } from "@/hooks/acelle/useCampaignFetch";

interface UseCampaignDetailsProps {
  campaignId: string;
  account: AcelleAccount;
}

interface UseCampaignDetailsReturn {
  campaign: AcelleCampaign | null;
  isLoading: boolean;
  error: string | null;
  setCampaign: React.Dispatch<React.SetStateAction<AcelleCampaign | null>>;
}

export const useCampaignDetails = ({
  campaignId,
  account
}: UseCampaignDetailsProps): UseCampaignDetailsReturn => {
  const [campaign, setCampaign] = useState<AcelleCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaignDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const loadedCampaign = await fetchCampaignById(campaignId, account.id);
        
        if (!loadedCampaign) {
          throw new Error("Impossible de récupérer les détails de la campagne");
        }
        
        console.log(`Campagne ${loadedCampaign.name} chargée`, loadedCampaign);
        setCampaign(loadedCampaign);
      } catch (err) {
        console.error("Erreur lors du chargement des détails de la campagne:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignDetails();
  }, [campaignId, account]);

  return {
    campaign,
    isLoading,
    error,
    setCampaign
  };
};
