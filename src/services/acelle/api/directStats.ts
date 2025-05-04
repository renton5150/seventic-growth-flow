
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
      
      // En mode démo, nous utilisons toujours les statistiques de démo
      if (options?.demoMode) {
        console.log(`Mode démo activé pour la campagne ${campaign.name}`);
        const demoData = await fetchAndProcessCampaignStats(campaign, account, { demoMode: true });
        
        enrichedCampaigns[i] = {
          ...campaign,
          statistics: demoData.statistics,
          delivery_info: demoData.delivery_info
        };
        continue;
      }
      
      // Si les statistiques semblent déjà complètes et qu'on ne force pas le rafraîchissement, on saute
      if (!options?.forceRefresh && 
          campaign.delivery_info && 
          typeof campaign.delivery_info === 'object' &&
          campaign.delivery_info.total && 
          campaign.delivery_info.delivered) {
        console.log(`Statistiques déjà disponibles pour la campagne ${campaign.name}, aucun enrichissement nécessaire`);
        continue;
      }
      
      console.log(`Récupération des statistiques pour la campagne ${campaign.name}`);
      
      // Récupérer les statistiques enrichies directement depuis l'API
      const result = await fetchAndProcessCampaignStats(
        campaign, 
        account, 
        { 
          refresh: true
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
      
      // En cas d'erreur, utiliser les données de démo comme fallback
      console.log(`Tentative d'utilisation du mode démo comme fallback pour la campagne ${enrichedCampaigns[i].name}`);
      
      try {
        const demoData = await fetchAndProcessCampaignStats(enrichedCampaigns[i], account, { demoMode: true });
        
        enrichedCampaigns[i] = {
          ...enrichedCampaigns[i],
          statistics: demoData.statistics,
          delivery_info: demoData.delivery_info
        };
      } catch (fallbackError) {
        console.error(`Échec du fallback pour la campagne ${enrichedCampaigns[i].name}:`, fallbackError);
        // Ne pas modifier la campagne si même le fallback échoue
      }
    }
  }
  
  return enrichedCampaigns;
};
