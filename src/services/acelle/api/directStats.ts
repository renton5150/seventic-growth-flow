
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "./campaignStats";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Enrichit les campagnes avec des statistiques directement depuis l'API Acelle
 * ou génère des statistiques démo si demandé
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[], 
  account: AcelleAccount,
  options?: { 
    demoMode?: boolean;
    forceRefresh?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  console.log(`Enrichissement de ${campaigns.length} campagnes avec des statistiques...`);
  
  const enrichedCampaigns = [...campaigns];
  
  for (let i = 0; i < enrichedCampaigns.length; i++) {
    try {
      const campaign = enrichedCampaigns[i];
      
      // Vérifier si les statistiques sont déjà complètes et qu'on ne force pas le rafraîchissement
      if (!options?.forceRefresh && 
          campaign.statistics?.subscriber_count && 
          campaign.statistics?.delivered_count) {
        continue;
      }
      
      console.log(`Récupération des statistiques pour la campagne ${campaign.name}`);
      
      // Récupérer les statistiques enrichies
      const result = await fetchAndProcessCampaignStats(
        campaign, 
        account, 
        { 
          demoMode: options?.demoMode,
          refresh: options?.forceRefresh
        }
      );
      
      // Appliquer les statistiques enrichies à la campagne
      enrichedCampaigns[i] = {
        ...campaign,
        statistics: result.statistics || createEmptyStatistics(),
        delivery_info: result.delivery_info || {}
      };
    } catch (error) {
      console.error(`Erreur lors de l'enrichissement de la campagne ${enrichedCampaigns[i].name}:`, error);
      // Ne pas modifier la campagne en cas d'erreur
    }
  }
  
  return enrichedCampaigns;
};
