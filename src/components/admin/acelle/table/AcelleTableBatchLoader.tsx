
import { useEffect, useState } from "react";
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/campaignStats";
import { refreshStatsCacheForCampaigns, extractQuickStats } from "@/services/acelle/api/optimizedStats";

interface AcelleTableBatchLoaderProps {
  campaigns: AcelleCampaign[];
  account?: AcelleAccount;
  demoMode?: boolean;
  onBatchLoaded?: () => void;
}

export const AcelleTableBatchLoader = ({ 
  campaigns, 
  account,
  demoMode = false,
  onBatchLoaded
}: AcelleTableBatchLoaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Fonction pour charger les statistiques par lot
    const loadBatchStatistics = async () => {
      if (!campaigns || campaigns.length === 0) return;
      
      console.log(`Chargement par lot des statistiques pour ${campaigns.length} campagnes`);
      setIsLoading(true);
      
      try {
        // Récupérer tous les UIDs des campagnes
        const campaignUids = campaigns
          .filter(c => c.uid || c.campaign_uid)
          .map(c => c.uid || c.campaign_uid || '');
        
        if (campaignUids.length === 0) return;
        
        // Pour le mode démo, simplement utiliser les statistiques existantes
        if (demoMode) {
          // Assurer que chaque campagne a des statistiques
          campaigns.forEach(campaign => {
            if (!campaign.statistics) {
              campaign.statistics = extractQuickStats(campaign);
            }
          });
          
          console.log("Mode démo: statistiques chargées depuis les données existantes");
          if (onBatchLoaded) onBatchLoaded();
          return;
        }
        
        // Sinon, rafraîchir le cache pour les campagnes
        await refreshStatsCacheForCampaigns(campaignUids);
        
        // Mise à jour des campagnes avec les statistiques du cache
        for (const campaign of campaigns) {
          if (!campaign.statistics && (campaign.uid || campaign.campaign_uid)) {
            try {
              // Essayer de récupérer et traiter les statistiques
              const result = await fetchAndProcessCampaignStats(campaign, account!, {
                demoMode,
                useCache: true
              });
              
              // Mettre à jour la campagne avec les statistiques récupérées
              campaign.statistics = result.statistics;
              
              // Si delivery_info n'existe pas, l'ajouter
              if (!campaign.delivery_info && result.delivery_info) {
                campaign.delivery_info = result.delivery_info;
              }
              
              console.log(`Statistiques chargées pour ${campaign.name}`);
            } catch (error) {
              console.error(`Erreur lors du chargement des statistiques pour ${campaign.name}:`, error);
            }
          }
        }
        
        console.log(`Chargement par lot terminé pour ${campaigns.length} campagnes`);
        if (onBatchLoaded) onBatchLoaded();
        
      } catch (error) {
        console.error("Erreur lors du chargement par lot des statistiques:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBatchStatistics();
  }, [campaigns, account, demoMode, onBatchLoaded]);
  
  // Ce composant ne rend rien, il ne sert qu'à déclencher le chargement par lot
  return null;
};
