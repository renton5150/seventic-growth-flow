
import { AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Assure que les statistiques ont toutes les valeurs requises
 * et sont de type approprié
 */
export const ensureValidStatistics = (statistics: AcelleCampaignStatistics): AcelleCampaignStatistics => {
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
    return defaultStats;
  }
  
  // Création d'une copie des valeurs par défaut pour les statistiques validées
  const validStats: AcelleCampaignStatistics = { ...defaultStats };
  
  // Parcourir chaque propriété et s'assurer qu'elle est de type approprié
  for (const key of Object.keys(defaultStats)) {
    const typedKey = key as keyof AcelleCampaignStatistics;
    const value = statistics[typedKey];
    
    // Convertir les valeurs en nombre si nécessaire
    if (value !== undefined) {
      if (typeof value === 'string') {
        validStats[typedKey] = Number(value) || 0;
      } else if (typeof value === 'number') {
        validStats[typedKey] = value;
      }
      // Ignorer les autres types de valeurs
    }
  }
  
  return validStats;
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
