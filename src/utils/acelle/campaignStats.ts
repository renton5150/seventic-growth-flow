
import { AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";

/**
 * Crée un objet de statistiques vide avec des valeurs par défaut
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

/**
 * Calcule des statistiques agrégées à partir d'une liste de campagnes
 */
export const calculateDeliveryStats = (campaigns = []) => {
  const stats = {
    totalEmails: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    averageOpenRate: 0,
    averageClickRate: 0
  };

  if (!campaigns.length) return stats;

  campaigns.forEach(campaign => {
    // Utiliser statistics ou delivery_info selon ce qui est disponible
    const data = campaign.statistics || {};
    const deliveryInfo = campaign.delivery_info || {};

    // Agréger les données
    stats.totalEmails += data.subscriber_count || deliveryInfo.total || 0;
    stats.totalDelivered += data.delivered_count || deliveryInfo.delivered || 0;
    stats.totalOpened += data.open_count || deliveryInfo.opened || 0;
    stats.totalClicked += data.click_count || deliveryInfo.clicked || 0;
    
    // Gestion pour le bounced qui peut être un nombre ou un objet
    const bounced = data.bounce_count || deliveryInfo.bounced;
    if (typeof bounced === 'object' && bounced !== null) {
      stats.totalBounced += bounced.total || 0;
    } else {
      stats.totalBounced += bounced || 0;
    }
  });

  // Calculer les taux moyens
  if (stats.totalDelivered > 0) {
    stats.averageOpenRate = (stats.totalOpened / stats.totalDelivered) * 100;
    stats.averageClickRate = (stats.totalClicked / stats.totalDelivered) * 100;
  }

  return stats;
};

/**
 * Extraction universelle de statistiques depuis n'importe quel format de données Acelle
 * Cette fonction tente d'extraire les statistiques depuis divers formats de réponse API
 */
export const extractStatisticsFromAnyFormat = (
  data: any, 
  verbose: boolean = false
): AcelleCampaignStatistics => {
  if (!data) {
    return createEmptyStatistics();
  }
  
  if (verbose) {
    console.log("Extraction de statistiques depuis:", data);
  }
  
  // Initialisation avec des valeurs vides
  const stats = createEmptyStatistics();
  
  // Convertir une valeur en nombre avec gestion sécurisée
  const toNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    
    // Si la valeur est déjà un nombre
    if (typeof value === 'number' && !isNaN(value)) return value;
    
    // Si la valeur est une chaîne avec pourcentage
    if (typeof value === 'string') {
      // Enlever le symbole % si présent
      const cleanValue = value.includes('%') 
        ? value.replace('%', '').trim()
        : value.trim();
      
      // Convertir en nombre
      const numValue = parseFloat(cleanValue);
      return !isNaN(numValue) ? numValue : 0;
    }
    
    // Pour tout autre cas, tenter une conversion forcée
    const numValue = Number(value);
    return !isNaN(numValue) ? numValue : 0;
  };
  
  // Extraire les données de diverses sources possibles
  // 1. Format delivery_info (database)
  if (data.delivery_info) {
    if (verbose) console.log("Format détecté: delivery_info");
    const di = data.delivery_info;
    
    stats.subscriber_count = toNumber(di.total || di.subscriber_count);
    stats.delivered_count = toNumber(di.delivered || di.delivered_count);
    stats.delivered_rate = toNumber(di.delivery_rate);
    stats.open_count = toNumber(di.opened || di.open_count);
    stats.uniq_open_count = toNumber(di.opened || di.uniq_open_count);
    stats.uniq_open_rate = toNumber(di.unique_open_rate || di.uniq_open_rate || di.open_rate);
    stats.click_count = toNumber(di.clicked || di.click_count);
    stats.click_rate = toNumber(di.click_rate);
    
    // Gestion des bounces qui peuvent être un objet ou un nombre
    if (di.bounced) {
      if (typeof di.bounced === 'object') {
        stats.bounce_count = toNumber(di.bounced.total);
        stats.soft_bounce_count = toNumber(di.bounced.soft);
        stats.hard_bounce_count = toNumber(di.bounced.hard);
      } else {
        stats.bounce_count = toNumber(di.bounced);
      }
    } else {
      stats.bounce_count = toNumber(di.bounce_count);
    }
    
    stats.unsubscribe_count = toNumber(di.unsubscribed || di.unsubscribe_count);
    stats.abuse_complaint_count = toNumber(di.complained || di.abuse_complaint_count);
  }
  // 2. Format statistics (object directement retourné par API)
  else if (data.statistics) {
    if (verbose) console.log("Format détecté: statistics");
    return extractStatisticsFromAnyFormat(data.statistics, verbose);
  }
  // 3. Format Campaign API (si on est dans la réponse d'une campagne)
  else if (data.campaign) {
    if (verbose) console.log("Format détecté: campaign API");
    // Soit traiter le format campaign ou utiliser delivery_info si disponible
    if (data.campaign.delivery_info) {
      return extractStatisticsFromAnyFormat(data.campaign.delivery_info, verbose);
    }
    
    // Format objet campaign
    const camp = data.campaign;
    stats.subscriber_count = toNumber(camp.total || camp.subscriber_count);
    stats.delivered_count = toNumber(camp.delivered || camp.delivered_count);
    stats.delivered_rate = toNumber(camp.delivery_rate);
    stats.open_count = toNumber(camp.opened || camp.open_count);
    stats.uniq_open_count = toNumber(camp.opened || camp.uniq_open_count);
    stats.uniq_open_rate = toNumber(camp.unique_open_rate || camp.uniq_open_rate || camp.open_rate);
    stats.click_count = toNumber(camp.clicked || camp.click_count);
    stats.click_rate = toNumber(camp.click_rate);
    
    // Gestion des bounces
    if (camp.bounced) {
      if (typeof camp.bounced === 'object') {
        stats.bounce_count = toNumber(camp.bounced.total);
        stats.soft_bounce_count = toNumber(camp.bounced.soft);
        stats.hard_bounce_count = toNumber(camp.bounced.hard);
      } else {
        stats.bounce_count = toNumber(camp.bounced);
      }
    } else {
      stats.bounce_count = toNumber(camp.bounce_count);
    }
    
    stats.unsubscribe_count = toNumber(camp.unsubscribed || camp.unsubscribe_count);
    stats.abuse_complaint_count = toNumber(camp.complained || camp.abuse_complaint_count);
  }
  // 4. Format direct API (à plat)
  else {
    if (verbose) console.log("Format détecté: direct API");
    stats.subscriber_count = toNumber(data.total || data.subscriber_count);
    stats.delivered_count = toNumber(data.delivered || data.delivered_count);
    stats.delivered_rate = toNumber(data.delivery_rate);
    stats.open_count = toNumber(data.opened || data.open_count);
    stats.uniq_open_count = toNumber(data.opened || data.uniq_open_count);
    stats.uniq_open_rate = toNumber(data.unique_open_rate || data.uniq_open_rate || data.open_rate);
    stats.click_count = toNumber(data.clicked || data.click_count);
    stats.click_rate = toNumber(data.click_rate);
    
    // Gestion des bounces
    if (data.bounced) {
      if (typeof data.bounced === 'object') {
        stats.bounce_count = toNumber(data.bounced.total);
        stats.soft_bounce_count = toNumber(data.bounced.soft);
        stats.hard_bounce_count = toNumber(data.bounced.hard);
      } else {
        stats.bounce_count = toNumber(data.bounced);
      }
    } else {
      stats.bounce_count = toNumber(data.bounce_count);
    }
    
    stats.unsubscribe_count = toNumber(data.unsubscribed || data.unsubscribe_count);
    stats.abuse_complaint_count = toNumber(data.complained || data.abuse_complaint_count);
  }

  // Vérifier la cohérence et calculer certaines valeurs si nécessaire
  if (stats.subscriber_count > 0 && stats.delivered_rate === 0 && stats.delivered_count > 0) {
    stats.delivered_rate = (stats.delivered_count / stats.subscriber_count) * 100;
  }
  
  if (stats.delivered_count > 0) {
    // Calculer le taux d'ouverture s'il n'est pas défini
    if (stats.uniq_open_rate === 0 && stats.open_count > 0) {
      stats.uniq_open_rate = (stats.open_count / stats.delivered_count) * 100;
    }
    
    // Calculer le taux de clics s'il n'est pas défini
    if (stats.click_rate === 0 && stats.click_count > 0) {
      stats.click_rate = (stats.click_count / stats.delivered_count) * 100;
    }
  }
  
  if (verbose) {
    console.log("Statistiques extraites:", stats);
  }
  
  return stats;
};

/**
 * Extrait les informations delivery_info à partir de diverses sources
 */
export const extractDeliveryInfo = (data: any): DeliveryInfo => {
  if (!data) return {};
  
  const stats = extractStatisticsFromAnyFormat(data);
  
  // Convertir les statistiques au format delivery_info
  const deliveryInfo: DeliveryInfo = {
    total: stats.subscriber_count,
    delivered: stats.delivered_count,
    delivery_rate: stats.delivered_rate,
    opened: stats.open_count,
    unique_open_rate: stats.uniq_open_rate,
    clicked: stats.click_count,
    click_rate: stats.click_rate,
    bounced: {
      soft: stats.soft_bounce_count,
      hard: stats.hard_bounce_count,
      total: stats.bounce_count
    },
    unsubscribed: stats.unsubscribe_count,
    complained: stats.abuse_complaint_count
  };
  
  return deliveryInfo;
};
