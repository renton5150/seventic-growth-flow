
import { useState, useEffect } from 'react';
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { toast } from "sonner";
import { fetchStatsBatch, refreshAllCampaignStats } from "@/services/acelle/api/directFetch";

export const useDirectStatsLoader = (
  campaigns: AcelleCampaign[],
  account?: AcelleAccount,
  demoMode: boolean = false
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enrichedCampaigns, setEnrichedCampaigns] = useState<AcelleCampaign[]>([]);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Charger les statistiques
  const loadStats = async (showToast: boolean = true) => {
    if (!campaigns.length) {
      setEnrichedCampaigns([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      if (showToast) {
        toast.loading("Chargement des statistiques...", { id: "load-stats" });
      }
      
      // Si en mode démo, utiliser les campagnes telles quelles
      if (demoMode) {
        setEnrichedCampaigns(campaigns);
        setLastLoadedAt(new Date());
        
        if (showToast) {
          toast.success("Statistiques démo chargées", { id: "load-stats" });
        }
        
        setIsLoading(false);
        return;
      }
      
      // Si pas de compte actif, ne rien charger
      if (!account) {
        setErrorMessage("Aucun compte Acelle actif");
        setIsLoading(false);
        
        if (showToast) {
          toast.error("Aucun compte Acelle actif", { id: "load-stats" });
        }
        
        return;
      }
      
      // Utiliser la nouvelle fonction directe pour récupérer les statistiques
      const enrichedData = await fetchStatsBatch(campaigns, account);
      setEnrichedCampaigns(enrichedData);
      setLastLoadedAt(new Date());
      
      // Vérifier si nous avons des données non-nulles
      const hasValidStats = enrichedData.some(campaign => 
        campaign.statistics && (
          campaign.statistics.subscriber_count > 0 || 
          campaign.statistics.open_count > 0
        )
      );
      
      if (showToast) {
        if (hasValidStats) {
          toast.success("Statistiques chargées avec succès", { id: "load-stats" });
        } else {
          toast.info("Statistiques chargées (certaines données peuvent être estimées)", { id: "load-stats" });
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      setErrorMessage("Erreur lors du chargement des statistiques");
      
      if (showToast) {
        toast.error("Erreur lors du chargement des statistiques", { id: "load-stats" });
      }
      
      // En cas d'erreur, utiliser les campagnes brutes
      setEnrichedCampaigns(campaigns);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Rafraîchir les statistiques manuellement
  const refreshStats = async () => {
    if (!account || demoMode || isRefreshing) return;
    
    setIsRefreshing(true);
    setErrorMessage(null);
    toast.loading("Rafraîchissement des statistiques...", { id: "refresh-stats" });
    
    try {
      // Appel à la nouvelle fonction de rafraîchissement direct
      const success = await refreshAllCampaignStats(account);
      
      if (success) {
        // Recharger les statistiques
        await loadStats(false);
        toast.success("Statistiques rafraîchies avec succès", { id: "refresh-stats" });
      } else {
        toast.warning("Certaines statistiques n'ont pas pu être rafraîchies", { id: "refresh-stats" });
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des statistiques:", error);
      setErrorMessage("Erreur lors du rafraîchissement des statistiques");
      toast.error("Erreur lors du rafraîchissement des statistiques", { id: "refresh-stats" });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Charger les statistiques au chargement initial ou lorsque les campagnes changent
  useEffect(() => {
    loadStats();
  }, [campaigns, account, demoMode]);

  return {
    isLoading,
    isRefreshing,
    enrichedCampaigns,
    errorMessage,
    lastLoadedAt,
    refreshStats,
    loadStats
  };
};
