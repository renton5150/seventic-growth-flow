
import { AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Valide et garantit que l'objet de statistiques contient toutes les propriétés nécessaires
 */
export const ensureValidStatistics = (data: any): AcelleCampaignStatistics => {
  // Si c'est null, créer un objet vide de statistiques
  if (!data) {
    return createEmptyStatistics();
  }

  // Créer un nouvel objet avec les propriétés validées
  const validStats: AcelleCampaignStatistics = {
    subscriber_count: parseNumber(data.subscriber_count),
    delivered_count: parseNumber(data.delivered_count) || parseNumber(data.delivered),
    delivered_rate: parseNumber(data.delivered_rate, true),
    open_count: parseNumber(data.open_count) || parseNumber(data.opened),
    uniq_open_count: parseNumber(data.uniq_open_count) || parseNumber(data.unique_opened),
    uniq_open_rate: parseNumber(data.uniq_open_rate, true) || parseNumber(data.unique_open_rate, true),
    click_count: parseNumber(data.click_count) || parseNumber(data.clicked),
    click_rate: parseNumber(data.click_rate, true),
    bounce_count: parseNumber(data.bounce_count) || getBounceCount(data),
    soft_bounce_count: parseNumber(data.soft_bounce_count),
    hard_bounce_count: parseNumber(data.hard_bounce_count),
    unsubscribe_count: parseNumber(data.unsubscribe_count),
    abuse_complaint_count: parseNumber(data.abuse_complaint_count),
  };

  console.log("Statistiques validées:", {
    original: {
      openRate: data.uniq_open_rate || data.unique_open_rate || data.open_rate,
      clickRate: data.click_rate,
      subscriberCount: data.subscriber_count
    },
    validated: {
      openRate: validStats.uniq_open_rate,
      clickRate: validStats.click_rate,
      subscriberCount: validStats.subscriber_count
    }
  });

  return validStats;
};

/**
 * Parse une valeur en nombre, retourne 0 si invalide
 * Gère plusieurs formats d'entrée
 */
const parseNumber = (value: any, isRate = false): number => {
  if (value === undefined || value === null) return 0;
  
  // Traiter les chaînes de caractères
  if (typeof value === 'string') {
    // Nettoyer la chaîne (supprimer %, etc.)
    const cleanValue = value.replace(/[^0-9.-,]/g, '').replace(',', '.');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  }
  
  // Traiter les nombres directement
  return typeof value === 'number' ? value : 0;
};

/**
 * Extrait le compte de bounces à partir de différentes structures possibles
 */
const getBounceCount = (data: any): number => {
  // Cas 1: bounce_count existe directement
  if (data.bounce_count !== undefined) {
    return parseNumber(data.bounce_count);
  }
  
  // Cas 2: bounced est un nombre
  if (typeof data.bounced === 'number' || typeof data.bounced === 'string') {
    return parseNumber(data.bounced);
  }
  
  // Cas 3: bounced est un objet avec total
  if (data.bounced && typeof data.bounced === 'object' && data.bounced.total !== undefined) {
    return parseNumber(data.bounced.total);
  }
  
  // Cas 4: bounced est un objet avec hard et soft
  if (data.bounced && typeof data.bounced === 'object') {
    const hard = parseNumber(data.bounced.hard);
    const soft = parseNumber(data.bounced.soft);
    return hard + soft;
  }
  
  // Par défaut
  return 0;
};

/**
 * Crée un objet de statistiques vide
 */
export const createEmptyStatistics = (): AcelleCampaignStatistics => {
  return {
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
};
