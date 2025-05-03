
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";

/**
 * Enrichit un lot de campagnes avec leurs statistiques
 * Version refactorisée pour n'utiliser QUE des statistiques réelles et jamais de statistiques simulées
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
  
  console.log(`Traitement de ${campaigns.length} campagnes pour enrichissement de statistiques`);
  
  // Copier les campagnes pour ne pas modifier les originales
  const enrichedCampaigns = [...campaigns];
  
  // Parcourir toutes les campagnes pour vérifier et enrichir les statistiques
  for (const campaign of enrichedCampaigns) {
    const campaignUid = campaign.uid || campaign.campaign_uid;
    console.log(`Vérification des statistiques pour la campagne ${campaign.name} (${campaignUid})`);
    
    // Vérifier si la campagne a déjà des statistiques valides
    const hasValidStats = isValidStatistics(campaign.statistics);
    const hasValidDeliveryInfo = isValidDeliveryInfo(campaign.delivery_info);
    
    // Vérifier si les statistiques sont marquées comme simulées
    const hasSimulatedStats = campaign.statistics?.is_simulated === true;
    const hasSimulatedDeliveryInfo = campaign.delivery_info?.is_simulated === true;
    
    // Conserver uniquement les statistiques si elles sont valides ET non simulées
    if (hasValidStats && !hasSimulatedStats) {
      console.log(`La campagne ${campaign.name} a des statistiques réelles valides, conservation des données existantes`);
      
      // Marquer explicitement comme données réelles
      campaign.statistics = {
        ...campaign.statistics,
        is_simulated: false
      };
    } else {
      console.log(`La campagne ${campaign.name} n'a pas de statistiques réelles valides`);
      // Ne pas générer de statistiques simulées - laisser les statistiques vides ou nulles
      campaign.statistics = undefined;
    }
    
    // Même logique pour delivery_info
    if (hasValidDeliveryInfo && !hasSimulatedDeliveryInfo) {
      console.log(`La campagne ${campaign.name} a des informations de livraison réelles valides, conservation des données existantes`);
      
      // Marquer explicitement comme données réelles
      if (campaign.delivery_info) {
        campaign.delivery_info = {
          ...campaign.delivery_info,
          is_simulated: false
        };
      }
    } else {
      console.log(`La campagne ${campaign.name} n'a pas d'informations de livraison réelles valides`);
      // Ne pas générer d'informations de livraison simulées - laisser vide ou null
      campaign.delivery_info = undefined;
    }
  }
  
  console.log(`${enrichedCampaigns.length} campagnes traitées, enrichissement terminé`);
  return enrichedCampaigns;
}

/**
 * Vérifie si un objet statistics semble valide (non vide et contenant les propriétés essentielles)
 */
function isValidStatistics(stats: AcelleCampaignStatistics | undefined): boolean {
  if (!stats) return false;
  
  // Ignorer explicitement les statistiques marquées comme simulées
  if (stats.is_simulated === true) return false;
  
  // Vérifier que les propriétés essentielles sont présentes et non nulles
  const requiredProps = ['subscriber_count', 'delivered_count', 'open_count'];
  for (const prop of requiredProps) {
    if (stats[prop] === undefined || stats[prop] === null) {
      return false;
    }
  }
  
  // Vérifier que les valeurs ne sont pas toutes à zéro (ce qui pourrait indiquer des données vides)
  const hasNonZeroValues = 
    stats.subscriber_count > 0 || 
    stats.delivered_count > 0 || 
    stats.open_count > 0;
  
  return hasNonZeroValues;
}

/**
 * Vérifie si un objet delivery_info semble valide
 */
function isValidDeliveryInfo(info: DeliveryInfo | undefined): boolean {
  if (!info) return false;
  
  // Ignorer explicitement les infos marquées comme simulées
  if (info.is_simulated === true) return false;
  
  // Vérifier que les propriétés essentielles sont présentes et non nulles
  const requiredProps = ['total', 'delivered', 'opened'];
  for (const prop of requiredProps) {
    if (info[prop] === undefined || info[prop] === null) {
      return false;
    }
  }
  
  // Vérifier que les valeurs ne sont pas toutes à zéro
  const hasNonZeroValues = 
    info.total > 0 || 
    info.delivered > 0 || 
    info.opened > 0;
  
  return hasNonZeroValues;
}
