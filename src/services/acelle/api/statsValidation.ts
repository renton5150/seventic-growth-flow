
import { AcelleCampaign } from "@/types/acelle.types";

/**
 * Vérifie si la campagne possède déjà des statistiques valides
 */
export const hasValidStatistics = (campaign: AcelleCampaign): boolean => {
  // Vérifier si les statistiques existent et ont au moins une valeur non nulle
  if (campaign.statistics && typeof campaign.statistics === 'object') {
    const stats = campaign.statistics;
    if (stats.subscriber_count > 0 || stats.delivered_count > 0 || stats.open_count > 0) {
      return true;
    }
  }
  
  // Vérifier si delivery_info existe et a au moins une valeur non nulle
  if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
    const info = campaign.delivery_info as any;
    if (
      (info.total && info.total > 0) || 
      (info.delivered && info.delivered > 0) || 
      (info.opened && info.opened > 0)
    ) {
      return true;
    }
  }
  
  return false;
};
