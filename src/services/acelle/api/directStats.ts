
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";

/**
 * Enrichit un lot de campagnes avec leurs statistiques
 * Cette version améliorée vérifie si les campagnes ont déjà des statistiques valides
 * avant de générer des statistiques simulées
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
    
    // Ne pas réutiliser des statistiques qui sont déjà marquées comme simulées
    const hasSimulatedStats = campaign.statistics?.is_simulated === true;
    const hasSimulatedDeliveryInfo = campaign.delivery_info?.is_simulated === true;
    
    // Seulement conserver les statistiques si elles sont valides ET non simulées
    if (hasValidStats && !hasSimulatedStats && hasValidDeliveryInfo && !hasSimulatedDeliveryInfo) {
      console.log(`La campagne ${campaign.name} a déjà des statistiques réelles valides, conservation des données existantes`);
      
      // S'assurer que les statistiques sont marquées comme réelles
      campaign.statistics = {
        ...campaign.statistics,
        is_simulated: false // Marquer comme données réelles
      };
      
      // S'assurer que delivery_info a aussi le marqueur
      if (campaign.delivery_info) {
        campaign.delivery_info = {
          ...campaign.delivery_info,
          is_simulated: false
        };
      }
      continue;
    }
    
    // Si la campagne n'a pas de statistiques valides, en générer des simulées
    console.log(`Génération de statistiques simulées pour la campagne ${campaign.name} (${campaignUid})`);
    
    // Générer des statistiques aléatoires réalistes
    const subscribers = Math.floor(Math.random() * 1000) + 50;
    const delivered = Math.floor(subscribers * (Math.random() * 0.1 + 0.9)); // 90-100% délivrés
    const deliveryRate = (delivered / subscribers) * 100;
    
    const opened = Math.floor(delivered * (Math.random() * 0.4 + 0.2)); // 20-60% ouverts
    const uniqueOpenRate = (opened / delivered) * 100;
    
    const clicked = Math.floor(opened * (Math.random() * 0.3 + 0.05)); // 5-35% cliqués parmi ouverts
    const clickRate = (clicked / delivered) * 100;
    
    const bounced = Math.floor(subscribers * (Math.random() * 0.05)); // 0-5% bounces
    const hardBounces = Math.floor(bounced * 0.6);
    const softBounces = bounced - hardBounces;
    
    const unsubscribed = Math.floor(delivered * (Math.random() * 0.02)); // 0-2% désabonnements
    
    // Créer l'objet statistics avec marqueur de simulation
    campaign.statistics = {
      subscriber_count: subscribers,
      delivered_count: delivered,
      delivered_rate: deliveryRate,
      open_count: opened,
      uniq_open_count: opened,
      uniq_open_rate: uniqueOpenRate,
      click_count: clicked,
      click_rate: clickRate,
      bounce_count: bounced,
      soft_bounce_count: softBounces,
      hard_bounce_count: hardBounces,
      unsubscribe_count: unsubscribed,
      abuse_complaint_count: Math.floor(unsubscribed * 0.1), // 10% des désabonnés se plaignent
      is_simulated: true // Marquer comme données simulées
    };
    
    // Créer l'objet delivery_info
    campaign.delivery_info = {
      total: subscribers,
      delivery_rate: deliveryRate,
      unique_open_rate: uniqueOpenRate,
      click_rate: clickRate,
      bounce_rate: (bounced / subscribers) * 100,
      unsubscribe_rate: (unsubscribed / delivered) * 100,
      delivered: delivered,
      opened: opened,
      clicked: clicked,
      bounced: { total: bounced, soft: softBounces, hard: hardBounces },
      unsubscribed: unsubscribed,
      complained: Math.floor(unsubscribed * 0.1),
      is_simulated: true // Marquer comme données simulées
    };
  }
  
  console.log(`${enrichedCampaigns.length} campagnes traitées, enrichissement terminé`);
  return enrichedCampaigns;
}

/**
 * Vérifie si un objet statistics semble valide (non vide et contenant les propriétés essentielles)
 */
function isValidStatistics(stats: AcelleCampaignStatistics | undefined): boolean {
  if (!stats) return false;
  
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
