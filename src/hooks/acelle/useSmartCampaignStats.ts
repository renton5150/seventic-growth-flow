
import { useState, useEffect, useCallback } from "react";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { getSmartCampaignStats, getBulkSmartCampaignStats } from "@/services/acelle/api/smartStats";
import { toast } from "sonner";

interface UseSmartCampaignStatsProps {
  campaign?: AcelleCampaign | null;
  campaigns?: AcelleCampaign[];
  account: AcelleAccount;
  autoLoad?: boolean;
}

interface UseSmartCampaignStatsReturn {
  statistics: AcelleCampaignStatistics | null;
  allStatistics: Record<string, AcelleCampaignStatistics>;
  isLoading: boolean;
  error: Error | null;
  loadStatistics: (forceRefresh?: boolean) => Promise<void>;
  lastUpdated: Date | null;
}

export const useSmartCampaignStats = ({
  campaign,
  campaigns = [],
  account,
  autoLoad = true
}: UseSmartCampaignStatsProps): UseSmartCampaignStatsReturn => {
  const [statistics, setStatistics] = useState<AcelleCampaignStatistics | null>(
    campaign?.statistics || null
  );
  const [allStatistics, setAllStatistics] = useState<Record<string, AcelleCampaignStatistics>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fonction pour charger les statistiques d'une seule campagne
  const loadSingleCampaignStats = useCallback(async (forceRefresh = false) => {
    if (!campaign || !account) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const stats = await getSmartCampaignStats(campaign, account, { forceRefresh });
      
      if (stats) {
        setStatistics(stats);
        setLastUpdated(new Date());
      } else if (campaign.statistics) {
        setStatistics(campaign.statistics);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des statistiques"));
    } finally {
      setIsLoading(false);
    }
  }, [campaign, account]);

  // Fonction pour charger les statistiques de plusieurs campagnes
  const loadMultipleCampaignStats = useCallback(async (forceRefresh = false) => {
    if (!campaigns.length || !account) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const stats = await getBulkSmartCampaignStats(campaigns, account, { forceRefresh });
      
      if (Object.keys(stats).length > 0) {
        setAllStatistics(stats);
        setLastUpdated(new Date());
        
        // Si une campagne unique est également spécifiée, mettre à jour ses statistiques
        if (campaign) {
          const campaignUid = campaign.uid || campaign.campaign_uid;
          if (campaignUid && stats[campaignUid]) {
            setStatistics(stats[campaignUid]);
          }
        }
      } else {
        // Utiliser les statistiques existantes comme fallback
        const existingStats: Record<string, AcelleCampaignStatistics> = {};
        campaigns.forEach(c => {
          const uid = c.uid || c.campaign_uid;
          if (uid && c.statistics) {
            existingStats[uid] = c.statistics;
          }
        });
        
        if (Object.keys(existingStats).length > 0) {
          setAllStatistics(existingStats);
        }
        
        // Également mettre à jour les statistiques de la campagne unique si nécessaire
        if (campaign && campaign.statistics) {
          setStatistics(campaign.statistics);
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques multiples:", err);
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement des statistiques"));
      
      // En cas d'erreur, utiliser les statistiques existantes comme fallback
      if (campaign && campaign.statistics) {
        setStatistics(campaign.statistics);
      }
    } finally {
      setIsLoading(false);
    }
  }, [campaigns, account, campaign]);

  // Fonction publique pour charger les statistiques
  const loadStatistics = useCallback(async (forceRefresh = false) => {
    if (campaigns.length > 0) {
      await loadMultipleCampaignStats(forceRefresh);
    } else if (campaign) {
      await loadSingleCampaignStats(forceRefresh);
    } else {
      console.log("Aucune campagne spécifiée pour charger les statistiques");
    }
  }, [loadSingleCampaignStats, loadMultipleCampaignStats, campaign, campaigns]);

  // Charger les statistiques au montage du composant si autoLoad est true
  useEffect(() => {
    if (autoLoad) {
      loadStatistics(false);
    }
  }, [autoLoad, loadStatistics]);

  // Mettre à jour les statistiques si la campagne ou les campagnes changent
  useEffect(() => {
    if (campaign?.statistics) {
      setStatistics(campaign.statistics);
    }
    
    if (campaigns.length > 0) {
      const existingStats: Record<string, AcelleCampaignStatistics> = {};
      campaigns.forEach(c => {
        const uid = c.uid || c.campaign_uid;
        if (uid && c.statistics) {
          existingStats[uid] = c.statistics;
        }
      });
      
      if (Object.keys(existingStats).length > 0) {
        setAllStatistics(prev => ({ ...prev, ...existingStats }));
      }
    }
  }, [campaign, campaigns]);

  return {
    statistics,
    allStatistics,
    isLoading,
    error,
    loadStatistics,
    lastUpdated
  };
};
