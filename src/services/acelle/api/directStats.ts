
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "./stats/campaignStats";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Enrichit les campagnes avec des statistiques directement depuis l'API Acelle
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[], 
  account: AcelleAccount,
  options?: { 
    forceRefresh?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  console.log(`Enrichissement de ${campaigns.length} campagnes avec des statistiques...`);
  
  // Vérification des informations du compte
  if (!account || !account.api_token || !account.api_endpoint) {
    console.error("Impossible d'enrichir les campagnes: informations de compte incomplètes", {
      hasAccount: !!account,
      hasToken: account ? !!account.api_token : false,
      hasEndpoint: account ? !!account.api_endpoint : false
    });
    return campaigns;
  }
  
  const enrichedCampaigns = [...campaigns];
  
  for (let i = 0; i < enrichedCampaigns.length; i++) {
    try {
      const campaign = enrichedCampaigns[i];
      
      // Si les statistiques semblent déjà complètes et qu'on ne force pas le rafraîchissement, on saute
      if (!options?.forceRefresh && 
          campaign.statistics && 
          campaign.statistics.subscriber_count > 0) {
        console.log(`Statistiques déjà disponibles pour la campagne ${campaign.name}, aucun enrichissement nécessaire`);
        continue;
      }
      
      console.log(`Récupération des statistiques pour la campagne ${campaign.name}`, {
        endpoint: account.api_endpoint,
        campaignId: campaign.uid || campaign.campaign_uid
      });
      
      // Récupérer les statistiques enrichies directement depuis l'API
      const enrichedCampaign = await fetchAndProcessCampaignStats(
        campaign, 
        account, 
        { refresh: true }
      ) as AcelleCampaign;
      
      // Appliquer les statistiques enrichies à la campagne
      enrichedCampaigns[i] = {
        ...campaign,
        statistics: enrichedCampaign.statistics || createEmptyStatistics(),
        delivery_info: enrichedCampaign.delivery_info || {}
      };
      
      console.log(`Statistiques appliquées à la campagne ${campaign.name}:`, {
        statistics: enrichedCampaigns[i].statistics,
        delivery_info: enrichedCampaigns[i].delivery_info
      });
    } catch (error) {
      console.error(`Erreur lors de l'enrichissement de la campagne ${enrichedCampaigns[i].name}:`, error);
      
      // Conserver les données existantes de la campagne
      console.log(`ERREUR: Impossible d'enrichir la campagne ${enrichedCampaigns[i].name}`);
    }
  }
  
  return enrichedCampaigns;
};
