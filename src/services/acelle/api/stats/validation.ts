
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
  const validatedStats: AcelleCampaignStatistics = { ...defaultStats };
  
  // Fonction stricte pour traiter les valeurs numériques
  const processNumericValue = (value: any): number => {
    // Si la valeur est null ou undefined, renvoyer 0
    if (value === null || value === undefined) {
      return 0;
    }
    
    // Si la valeur est une chaîne avec pourcentage, convertir en nombre
    if (typeof value === 'string') {
      // Enlever le symbole % si présent
      const cleanValue = value.includes('%') 
        ? value.replace('%', '').trim()
        : value.trim();
        
      // Convertir en nombre
      const numValue = parseFloat(cleanValue);
      return !isNaN(numValue) ? numValue : 0;
    }
    
    // Si c'est déjà un nombre, le retourner directement
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    // Pour tout autre cas, tenter une conversion forcée
    const numValue = Number(value);
    return !isNaN(numValue) ? numValue : 0;
  };
  
  // Appliquer les valeurs fournies avec validation stricte pour chaque propriété
  const applyIfExists = (key: keyof AcelleCampaignStatistics) => {
    if (statistics[key] !== undefined) {
      (validatedStats as any)[key] = processNumericValue(statistics[key]);
    }
  };
  
  // Appliquer pour chaque propriété
  applyIfExists("subscriber_count");
  applyIfExists("delivered_count");
  applyIfExists("delivered_rate");
  applyIfExists("open_count");
  applyIfExists("uniq_open_count");
  applyIfExists("uniq_open_rate");
  applyIfExists("click_count");
  applyIfExists("click_rate");
  applyIfExists("bounce_count");
  applyIfExists("soft_bounce_count");
  applyIfExists("hard_bounce_count");
  applyIfExists("unsubscribe_count");
  applyIfExists("abuse_complaint_count");
  
  // Utiliser unique_open_rate comme fallback pour uniq_open_rate si disponible
  if ((statistics as any).unique_open_rate !== undefined && validatedStats.uniq_open_rate === 0) {
    validatedStats.uniq_open_rate = processNumericValue((statistics as any).unique_open_rate);
  }
  
  // Utiliser opened comme fallback pour uniq_open_count si disponible
  if ((statistics as any).opened !== undefined && validatedStats.uniq_open_count === 0) {
    validatedStats.uniq_open_count = processNumericValue((statistics as any).opened);
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
