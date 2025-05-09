
import { AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Assure que l'objet de statistiques contient toutes les propriétés requises
 * avec des valeurs valides (non-undefined, non-null).
 * 
 * @param statistics Les statistiques à valider/normaliser
 * @returns Statistiques complètes avec valeurs par défaut pour les champs manquants
 */
export const ensureValidStatistics = (statistics: Partial<AcelleCampaignStatistics>): AcelleCampaignStatistics => {
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
    console.warn("[Validation] Statistiques nulles/undefined - utilisation des valeurs par défaut");
    return { ...defaultStats };
  }
  
  // Fusionner les statistiques fournies avec les valeurs par défaut
  const validatedStats: AcelleCampaignStatistics = { ...defaultStats };
  
  // Normaliser chaque champ pour s'assurer qu'il est un nombre valide
  for (const [key, value] of Object.entries(statistics)) {
    if (key in defaultStats) {
      // Si la valeur est une chaîne qui contient %, la convertir en nombre
      if (typeof value === 'string' && value.includes('%')) {
        validatedStats[key as keyof AcelleCampaignStatistics] = 
          parseFloat(value.replace('%', '')) || defaultStats[key as keyof AcelleCampaignStatistics];
      }
      // Si c'est un nombre ou une chaîne numérique, la convertir directement
      else if (value !== null && value !== undefined) {
        const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        validatedStats[key as keyof AcelleCampaignStatistics] = 
          !isNaN(numValue) ? numValue : defaultStats[key as keyof AcelleCampaignStatistics];
      }
    }
  }
  
  // Petite vérification de cohérence: si certaines valeurs sont manquantes mais peuvent être calculées
  if (validatedStats.subscriber_count > 0) {
    // Si delivered_rate est défini mais pas delivered_count
    if (validatedStats.delivered_rate > 0 && validatedStats.delivered_count === 0) {
      validatedStats.delivered_count = Math.round(validatedStats.subscriber_count * (validatedStats.delivered_rate / 100));
    }
    // Si delivered_count est défini mais pas delivered_rate
    else if (validatedStats.delivered_count > 0 && validatedStats.delivered_rate === 0) {
      validatedStats.delivered_rate = (validatedStats.delivered_count / validatedStats.subscriber_count) * 100;
    }
  }
  
  if (validatedStats.delivered_count > 0) {
    // Si uniq_open_rate est défini mais pas open_count/uniq_open_count
    if (validatedStats.uniq_open_rate > 0 && validatedStats.uniq_open_count === 0) {
      validatedStats.uniq_open_count = Math.round(validatedStats.delivered_count * (validatedStats.uniq_open_rate / 100));
      
      // Si open_count est également manquant, estimer avec un ratio typique
      if (validatedStats.open_count === 0) {
        validatedStats.open_count = Math.round(validatedStats.uniq_open_count * 1.5); // Estimation: 1,5 ouvertures par utilisateur unique
      }
    }
    
    // Si click_rate est défini mais pas click_count
    if (validatedStats.click_rate > 0 && validatedStats.click_count === 0) {
      validatedStats.click_count = Math.round(validatedStats.delivered_count * (validatedStats.click_rate / 100));
    }
  }
  
  return validatedStats;
};
