
import { AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Assure que les statistiques ont toutes les valeurs requises
 * et sont de type approprié
 */
export const ensureValidStatistics = (
  statistics?: AcelleCampaignStatistics | null | undefined
): AcelleCampaignStatistics => {
  // Valeurs par défaut pour les statistiques manquantes
  const defaultStats: AcelleCampaignStatistics = {
    subscriber_count: 0,
    delivered_count: 0,
    delivered_rate: 0,
    open_count: 0,
    uniq_open_count: 0,
    uniq_open_rate: 0,
    click_count: 0,
    click_rate: 0,
    bounce_count: 0,
    soft_bounce_count: 0,
    hard_bounce_count: 0,
    unsubscribe_count: 0,
    abuse_complaint_count: 0
  };
  
  // Si aucune statistique n'est fournie, retourner les valeurs par défaut
  if (!statistics) {
    return { ...defaultStats };
  }
  
  // Fonction pour normaliser une valeur en nombre
  const normalizeToNumber = (value: any): number => {
    if (typeof value === 'string') {
      return Number(value) || 0;
    } else if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    return 0;
  };
  
  // Construction de l'objet de statistiques validées en utilisant la propagation
  // et en normalisant explicitement chaque valeur
  return {
    subscriber_count: normalizeToNumber(statistics.subscriber_count),
    delivered_count: normalizeToNumber(statistics.delivered_count),
    delivered_rate: normalizeToNumber(statistics.delivered_rate),
    open_count: normalizeToNumber(statistics.open_count),
    uniq_open_count: normalizeToNumber(statistics.uniq_open_count),
    uniq_open_rate: normalizeToNumber(statistics.uniq_open_rate),
    click_count: normalizeToNumber(statistics.click_count),
    click_rate: normalizeToNumber(statistics.click_rate),
    bounce_count: normalizeToNumber(statistics.bounce_count),
    soft_bounce_count: normalizeToNumber(statistics.soft_bounce_count),
    hard_bounce_count: normalizeToNumber(statistics.hard_bounce_count),
    unsubscribe_count: normalizeToNumber(statistics.unsubscribe_count),
    abuse_complaint_count: normalizeToNumber(statistics.abuse_complaint_count)
  };
};

/**
 * Vérifie si les statistiques sont considérées comme périmées
 * en fonction d'un seuil de temps
 */
export const areStatisticsStale = (lastUpdated: string, staleThresholdMinutes: number = 60): boolean => {
  try {
    const lastUpdateTime = new Date(lastUpdated).getTime();
    const currentTime = Date.now();
    const thresholdMs = staleThresholdMinutes * 60 * 1000;
    
    return currentTime - lastUpdateTime > thresholdMs;
  } catch (error) {
    // En cas d'erreur, considérer les statistiques comme périmées
    console.error("Error checking staleness:", error);
    return true;
  }
};
