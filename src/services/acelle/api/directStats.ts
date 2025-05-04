
import { AcelleCampaign, AcelleAccount } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "./campaignStats";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Enrichit les campagnes avec des statistiques directement depuis l'API Acelle
 * N'utilise les données démo QUE si explicitement demandé
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
      
      // En mode démo, nous utilisons toujours les statistiques de démo
      if (options?.demoMode) {
        console.log(`Mode démo activé explicitement pour la campagne ${campaign.name}`);
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
      
      console.log(`Récupération des statistiques pour la campagne ${campaign.name}`, {
        endpoint: account.api_endpoint,
        campaignId: campaign.uid || campaign.campaign_uid
      });
      
      // Récupérer les statistiques enrichies directement depuis l'API
      const result = await fetchAndProcessCampaignStats(
        campaign, 
        account, 
        { 
          refresh: true,
          // NE PAS UTILISER de mode démo automatique sauf si spécifié
          demoMode: false
        }
      );
      
      // Appliquer les statistiques enrichies à la campagne
      enrichedCampaigns[i] = {
        ...campaign,
        statistics: result.statistics || createEmptyStatistics(),
        delivery_info: result.delivery_info || {}
      };
      
      console.log(`Statistiques appliquées à la campagne ${campaign.name}:`, {
        statistics: result.statistics,
        delivery_info: result.delivery_info
      });
    } catch (error) {
      console.error(`Erreur lors de l'enrichissement de la campagne ${enrichedCampaigns[i].name}:`, error);
      
      // NE PAS utiliser le mode démo comme fallback, afficher une erreur correctement
      // et conserver les données existantes de la campagne
      console.log(`ERREUR: Impossible d'enrichir la campagne ${enrichedCampaigns[i].name}`);
      
      // On ne modifie pas la campagne, on garde l'état actuel
    }
  }
  
  return enrichedCampaigns;
};
