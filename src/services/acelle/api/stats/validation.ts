
import { AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * S'assure qu'un objet de statistiques respecte l'interface AcelleCampaignStatistics
 * en fournissant des valeurs par défaut pour les propriétés manquantes
 */
export function ensureValidStatistics(data: any): AcelleCampaignStatistics {
  // Créer une structure de base avec des valeurs par défaut
  const validStats: AcelleCampaignStatistics = {
    subscriber_count: 0,
    delivered_count: 0,
    delivered_rate: 0,
    open_count: 0,
    uniq_open_count: 0, // Ensuring this field exists
    uniq_open_rate: 0,
    click_count: 0,
    click_rate: 0,
    bounce_count: 0,
    soft_bounce_count: 0,
    hard_bounce_count: 0,
    unsubscribe_count: 0,
    abuse_complaint_count: 0
  };
  
  // Si les données d'entrée sont nulles ou non-objets, retourner les valeurs par défaut
  if (!data || typeof data !== 'object') {
    return validStats;
  }
  
  // Fusionner les données d'entrée avec la structure de base
  // en ne conservant que les propriétés valides
  return {
    subscriber_count: typeof data.subscriber_count === 'number' ? data.subscriber_count : validStats.subscriber_count,
    delivered_count: typeof data.delivered_count === 'number' ? data.delivered_count : validStats.delivered_count,
    delivered_rate: typeof data.delivered_rate === 'number' ? data.delivered_rate : validStats.delivered_rate,
    open_count: typeof data.open_count === 'number' ? data.open_count : validStats.open_count,
    uniq_open_count: typeof data.uniq_open_count === 'number' ? data.uniq_open_count : validStats.uniq_open_count,
    uniq_open_rate: typeof data.uniq_open_rate === 'number' ? data.uniq_open_rate : validStats.uniq_open_rate,
    click_count: typeof data.click_count === 'number' ? data.click_count : validStats.click_count,
    click_rate: typeof data.click_rate === 'number' ? data.click_rate : validStats.click_rate,
    bounce_count: typeof data.bounce_count === 'number' ? data.bounce_count : validStats.bounce_count,
    soft_bounce_count: typeof data.soft_bounce_count === 'number' ? data.soft_bounce_count : validStats.soft_bounce_count,
    hard_bounce_count: typeof data.hard_bounce_count === 'number' ? data.hard_bounce_count : validStats.hard_bounce_count,
    unsubscribe_count: typeof data.unsubscribe_count === 'number' ? data.unsubscribe_count : validStats.unsubscribe_count,
    abuse_complaint_count: typeof data.abuse_complaint_count === 'number' ? data.abuse_complaint_count : validStats.abuse_complaint_count
  };
}
