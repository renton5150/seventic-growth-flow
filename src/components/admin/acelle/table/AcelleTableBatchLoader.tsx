
import { useEffect, useState } from "react";
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "@/services/acelle/api/campaignStats";
import { refreshStatsCacheForCampaigns, extractQuickStats } from "@/services/acelle/api/optimizedStats";

interface AcelleTableBatchLoaderProps {
  campaigns: AcelleCampaign[];
  account?: AcelleAccount;
  demoMode?: boolean;
  onBatchLoaded?: (updatedCampaigns: AcelleCampaign[]) => void;
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
        // Create a deep copy of campaigns to avoid mutating props
        const updatedCampaigns = JSON.parse(JSON.stringify(campaigns)) as AcelleCampaign[];
        
        // Récupérer tous les UIDs des campagnes
        const campaignUids = updatedCampaigns
          .filter(c => c.uid || c.campaign_uid)
          .map(c => c.uid || c.campaign_uid || '');
        
        if (campaignUids.length === 0) {
          console.log("Aucun UID de campagne valide trouvé");
          return;
        }
        
        // Pour le mode démo, simplement utiliser les statistiques existantes ou en créer
        if (demoMode) {
          // S'assurer que chaque campagne a des statistiques
          updatedCampaigns.forEach(campaign => {
            if (!campaign.statistics) {
              campaign.statistics = extractQuickStats(campaign);
            }
          });
          
          console.log("Mode démo: statistiques prêtes pour l'affichage");
          if (onBatchLoaded) onBatchLoaded(updatedCampaigns);
          return;
        }
        
        // Rafraîchir d'abord le cache pour tous les UIDs
        await refreshStatsCacheForCampaigns(campaignUids);
        
        // Traiter ensuite chaque campagne individuellement pour assigner les statistiques
        let processedCount = 0;
        for (let i = 0; i < updatedCampaigns.length; i++) {
          const campaign = updatedCampaigns[i];
          const campaignUid = campaign.uid || campaign.campaign_uid;
          
          if (campaignUid) {
            try {
              // Récupérer et traiter les statistiques avec cache
              const result = await fetchAndProcessCampaignStats(campaign, account!, {
                demoMode,
                useCache: true
              });
              
              // Mettre à jour la campagne avec les statistiques récupérées
              updatedCampaigns[i].statistics = result.statistics;
              
              // Mettre à jour delivery_info si nécessaire
              if (!updatedCampaigns[i].delivery_info && result.delivery_info) {
                updatedCampaigns[i].delivery_info = result.delivery_info;
              }
              
              processedCount++;
              if (processedCount % 5 === 0 || processedCount === updatedCampaigns.length) {
                console.log(`${processedCount}/${updatedCampaigns.length} statistiques chargées`);
              }
            } catch (error) {
              console.error(`Erreur lors du chargement des statistiques pour ${campaign.name}:`, error);
            }
          }
        }
        
        console.log(`Chargement par lot terminé: ${processedCount}/${updatedCampaigns.length} campagnes traitées`);
        
        // Return the updated campaigns through the callback
        if (onBatchLoaded) onBatchLoaded(updatedCampaigns);
        
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
