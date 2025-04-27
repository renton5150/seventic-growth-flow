
import { useState } from 'react';
import { acelleService } from '@/services/acelle/acelle-service';
import { AcelleCampaign, AcelleAccount } from '@/types/acelle.types';

export const useCampaignFetch = (account: AcelleAccount | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<AcelleCampaign[]>([]);

  const fetchCampaigns = async () => {
    if (!account) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Utiliser le service mockup
      const result = await acelleService.getAcelleCampaigns();
      setCampaigns(result);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setError("Impossible de récupérer les campagnes");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    campaigns,
    isLoading,
    error,
    fetchCampaigns
  };
};
