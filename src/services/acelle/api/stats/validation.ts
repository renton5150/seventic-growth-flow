
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
  
  // Créer un nouvel objet avec les valeurs par défaut
  const validatedStats = { ...defaultStats };
  
  // Fonction pour traiter en toute sécurité les valeurs numériques
  const processNumericValue = (key: keyof AcelleCampaignStatistics, value: any): number => {
    if (value === null || value === undefined) {
      return defaultStats[key];
    }
    
    // Si la valeur est une chaîne avec pourcentage, convertir en nombre
    if (typeof value === 'string' && value.includes('%')) {
      const numValue = parseFloat(value.replace('%', ''));
      return !isNaN(numValue) ? numValue : defaultStats[key];
    }
    
    // Pour les autres types de valeurs
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    return !isNaN(numValue) ? numValue : defaultStats[key];
  };
  
  // Traiter chaque propriété connue individuellement pour éviter les erreurs de typage
  if (statistics.subscriber_count !== undefined) {
    validatedStats.subscriber_count = processNumericValue('subscriber_count', statistics.subscriber_count);
  }
  
  if (statistics.delivered_count !== undefined) {
    validatedStats.delivered_count = processNumericValue('delivered_count', statistics.delivered_count);
  }
  
  if (statistics.delivered_rate !== undefined) {
    validatedStats.delivered_rate = processNumericValue('delivered_rate', statistics.delivered_rate);
  }
  
  if (statistics.open_count !== undefined) {
    validatedStats.open_count = processNumericValue('open_count', statistics.open_count);
  }
  
  if (statistics.uniq_open_count !== undefined) {
    validatedStats.uniq_open_count = processNumericValue('uniq_open_count', statistics.uniq_open_count);
  }
  
  if (statistics.uniq_open_rate !== undefined) {
    validatedStats.uniq_open_rate = processNumericValue('uniq_open_rate', statistics.uniq_open_rate);
  }
  
  // Utiliser unique_open_rate comme fallback pour uniq_open_rate si disponible
  if (statistics.unique_open_rate !== undefined && validatedStats.uniq_open_rate === 0) {
    validatedStats.uniq_open_rate = processNumericValue('uniq_open_rate', statistics.unique_open_rate);
  }
  
  if (statistics.click_count !== undefined) {
    validatedStats.click_count = processNumericValue('click_count', statistics.click_count);
  }
  
  if (statistics.click_rate !== undefined) {
    validatedStats.click_rate = processNumericValue('click_rate', statistics.click_rate);
  }
  
  if (statistics.bounce_count !== undefined) {
    validatedStats.bounce_count = processNumericValue('bounce_count', statistics.bounce_count);
  }
  
  if (statistics.soft_bounce_count !== undefined) {
    validatedStats.soft_bounce_count = processNumericValue('soft_bounce_count', statistics.soft_bounce_count);
  }
  
  if (statistics.hard_bounce_count !== undefined) {
    validatedStats.hard_bounce_count = processNumericValue('hard_bounce_count', statistics.hard_bounce_count);
  }
  
  if (statistics.unsubscribe_count !== undefined) {
    validatedStats.unsubscribe_count = processNumericValue('unsubscribe_count', statistics.unsubscribe_count);
  }
  
  if (statistics.abuse_complaint_count !== undefined) {
    validatedStats.abuse_complaint_count = processNumericValue('abuse_complaint_count', statistics.abuse_complaint_count);
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
  
  // Log des statistiques pour debug
  console.log("[Validation] Statistiques après normalisation:", validatedStats);
  
  return validatedStats;
};
