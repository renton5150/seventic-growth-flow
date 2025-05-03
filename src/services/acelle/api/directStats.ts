
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { fetchDirectCampaignStats } from "./directCampaignFetch";

/**
 * Enrichit un lot de campagnes avec leurs statistiques
 */
export async function enrichCampaignsWithStats(
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  token: string
): Promise<AcelleCampaign[]> {
  if (!campaigns || campaigns.length === 0) {
    console.log("Aucune campagne à enrichir");
    return [];
  }
  
  if (!account || !account.id) {
    console.error("Compte Acelle invalide pour l'enrichissement");
    return campaigns;
  }
  
  if (!token) {
    console.error("Token manquant pour l'enrichissement des statistiques");
    return campaigns;
  }
  
  console.log(`Enrichissement de ${campaigns.length} campagnes avec leurs statistiques`);
  
  const enrichedCampaigns: AcelleCampaign[] = [];
  
  // Traiter séquentiellement pour éviter les problèmes de rate limit
  for (const campaign of campaigns) {
    try {
      const campaignUid = campaign.uid || campaign.campaign_uid;
      if (!campaignUid) {
        console.warn("Campaign without UID detected during enrichment, skipping", campaign);
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      console.log(`Récupération des statistiques pour enrichir la campagne ${campaignUid}`);
      const { statistics, delivery_info } = await fetchDirectCampaignStats(campaignUid, account, token);
      
      // Enrichir la campagne avec les statistiques obtenues
      const enrichedCampaign = {
        ...campaign,
        statistics,
        delivery_info
      };
      
      enrichedCampaigns.push(enrichedCampaign);
    } catch (error) {
      console.error("Erreur lors de l'enrichissement d'une campagne:", error);
      // Ajouter la campagne non enrichie pour ne pas perdre de données
      enrichedCampaigns.push(campaign);
    }
  }
  
  console.log(`${enrichedCampaigns.length} campagnes enrichies avec leurs statistiques`);
  return enrichedCampaigns;
}
