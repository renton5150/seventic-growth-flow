
// Traduction des statuts de campagne
export const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    "new": "Nouveau",
    "queued": "En attente",
    "sending": "En envoi",
    "sent": "Envoyé",
    "paused": "En pause",
    "failed": "Échoué",
    "ready": "Prêt",
    "unknown": "Inconnu",
    "done": "Terminé" // Ajout pour couvrir un autre statut possible
  };
  
  return translations[status?.toLowerCase()] || status;
};

// Obtenir la variante de badge appropriée selon le statut
export const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
  switch (status?.toLowerCase()) {
    case "sent":
    case "done":
      return "success";
    case "sending":
      return "warning";
    case "queued":
      return "secondary";
    case "new":
      return "outline";
    case "ready":
      return "secondary";
    case "paused":
      return "warning";
    case "failed":
      return "destructive";
    default:
      return "default";
  }
};

// Format d'affichage pourcentage
export const renderPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null) return "0%";
  return `${value.toFixed(1)}%`;
};

/**
 * Récupère directement les statistiques d'une campagne depuis l'API Acelle
 * via l'endpoint campaigns/{uid}
 * 
 * @param campaign Object campagne contenant au moins l'UID
 * @param apiEndpoint URL de base de l'API
 * @param apiToken Token d'authentification
 * @returns Promise<any> Données de statistiques ou null en cas d'échec
 */
export const fetchCampaignStats = async (
  campaignUid: string,
  apiEndpoint: string,
  apiToken: string
): Promise<any> => {
  if (!campaignUid || !apiEndpoint || !apiToken) {
    console.warn("Paramètres manquants pour fetchCampaignStats", { campaignUid, hasEndpoint: !!apiEndpoint, hasToken: !!apiToken });
    return null;
  }

  try {
    // Construire l'URL pour récupérer les détails de la campagne
    const endpoint = apiEndpoint.endsWith('/') ? apiEndpoint : apiEndpoint + '/';
    const url = `${endpoint}campaigns/${campaignUid}?api_token=${apiToken}`;
    
    console.log(`Récupération des statistiques pour la campagne ${campaignUid}...`);
    
    // Appel à l'API Acelle
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Statistiques récupérées avec succès pour la campagne ${campaignUid}:`, data);
    
    return data;
  } catch (error) {
    console.error(`Échec de récupération des statistiques pour la campagne ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Génère des statistiques de campagne basiques à partir des données brutes
 * 
 * @param rawStats Données brutes de statistiques
 * @returns Objet contenant les statistiques formatées
 */
export const processRawStats = (rawStats: any): Record<string, number> => {
  if (!rawStats) return {};
  
  try {
    // Extraire les statistiques pertinentes, avec les bonnes conversions de types
    const stats: Record<string, number> = {
      subscriber_count: parseInt(rawStats.subscribers_count || rawStats.recipients_count || '0', 10),
      delivered_count: parseInt(rawStats.delivery_stats?.delivered || '0', 10),
      open_count: parseInt(rawStats.delivery_stats?.opened || '0', 10),
      click_count: parseInt(rawStats.delivery_stats?.clicked || '0', 10),
      bounce_count: parseInt(rawStats.delivery_stats?.bounced || '0', 10),
      unsubscribe_count: parseInt(rawStats.delivery_stats?.unsubscribed || '0', 10),
      complaint_count: parseInt(rawStats.delivery_stats?.complained || '0', 10)
    };
    
    // Calculer les taux (pourcentages)
    if (stats.subscriber_count > 0) {
      stats.delivered_rate = (stats.delivered_count / stats.subscriber_count) * 100;
      stats.open_rate = (stats.open_count / stats.delivered_count) * 100;
      stats.click_rate = (stats.click_count / stats.delivered_count) * 100;
      stats.bounce_rate = (stats.bounce_count / stats.subscriber_count) * 100;
      stats.unsubscribe_rate = (stats.unsubscribe_count / stats.delivered_count) * 100;
    }
    
    return stats;
  } catch (error) {
    console.error("Erreur lors du traitement des statistiques brutes:", error);
    return {};
  }
};

/**
 * Extrait une statistique de campagne avec gestion avancée des structures de données
 * 
 * Recherche la statistique dans plusieurs emplacements possibles:
 * 1. Dans delivery_info avec mappage de nom spécifique
 * 2. Dans statistics si disponible
 * 3. Directement dans l'objet campaign
 * 
 * @param campaign Objet campagne Acelle
 * @param key Clé de la statistique à extraire
 * @returns Valeur numérique de la statistique ou 0 si non trouvée
 */
export const extractCampaignStat = (campaign: any, key: string): number => {
  if (!campaign) return 0;
  
  try {
    // Définition du mappage pour delivery_info 
    const deliveryInfoMap: Record<string, string> = {
      'subscriber_count': 'total',
      'delivered_count': 'delivered',
      'open_count': 'opened',
      'click_count': 'clicked',
      'uniq_open_rate': 'unique_open_rate',
      'click_rate': 'click_rate'
    };
    
    // Vérifier dans delivery_info (structure standard de l'API Acelle)
    if (campaign.delivery_info) {
      // Cas spéciaux pour les statistiques de bounce
      if (key === 'bounce_count' && campaign.delivery_info.bounced) {
        return typeof campaign.delivery_info.bounced.total === 'number' 
          ? campaign.delivery_info.bounced.total 
          : (typeof campaign.delivery_info.bounced === 'number' ? campaign.delivery_info.bounced : 0);
      }
      
      // Mappage des clés pour delivery_info (format API vers format interne)
      const mappedKey = deliveryInfoMap[key];
      if (mappedKey && typeof campaign.delivery_info[mappedKey] === 'number') {
        console.log(`Stat trouvée dans delivery_info[${mappedKey}]:`, campaign.delivery_info[mappedKey]);
        return campaign.delivery_info[mappedKey] as number;
      }
      
      // Essayer également la clé directe si le mappage échoue
      if (typeof campaign.delivery_info[key] === 'number') {
        console.log(`Stat trouvée directement dans delivery_info[${key}]:`, campaign.delivery_info[key]);
        return campaign.delivery_info[key] as number;
      }
    }
    
    // Vérifier dans statistics (structure alternative)
    if (campaign.statistics) {
      if (typeof campaign.statistics[key] === 'number') {
        console.log(`Stat trouvée dans statistics[${key}]:`, campaign.statistics[key]);
        return campaign.statistics[key] as number;
      }
    }
    
    // Vérifier directement dans la campagne
    if (typeof campaign[key] === 'number') {
      console.log(`Stat trouvée directement dans campaign[${key}]:`, campaign[key]);
      return campaign[key] as number;
    }
    
    // Convertir "stringified numbers" en nombres si présents
    if (typeof campaign[key] === 'string' && !isNaN(parseFloat(campaign[key]))) {
      console.log(`Stat trouvée comme string dans campaign[${key}]:`, parseFloat(campaign[key]));
      return parseFloat(campaign[key]);
    }
    
    if (campaign.statistics && typeof campaign.statistics[key] === 'string' && 
        !isNaN(parseFloat(campaign.statistics[key]))) {
      console.log(`Stat trouvée comme string dans statistics[${key}]:`, parseFloat(campaign.statistics[key]));
      return parseFloat(campaign.statistics[key]);
    }
    
    // Vérification spécifique pour les valeurs en chaîne dans delivery_info
    if (campaign.delivery_info) {
      const mappedKey = deliveryInfoMap[key];
      if (mappedKey && typeof campaign.delivery_info[mappedKey] === 'string' && 
          !isNaN(parseFloat(campaign.delivery_info[mappedKey]))) {
        console.log(`Stat trouvée comme string dans delivery_info[${mappedKey}]:`, 
          parseFloat(campaign.delivery_info[mappedKey]));
        return parseFloat(campaign.delivery_info[mappedKey]);
      }
    }
    
    // Si rien n'est trouvé après toutes les tentatives
    console.warn(`Aucune statistique trouvée pour ${key} dans:`, {
      campaign_name: campaign.name,
      has_delivery_info: !!campaign.delivery_info,
      has_statistics: !!campaign.statistics
    });
    
    return 0;
  } catch (error) {
    console.warn(`Erreur lors de l'extraction de ${key}:`, error);
    return 0;
  }
};

/**
 * Génère des statistiques de campagne par défaut 
 * avec des valeurs fictives pour simuler des données
 * lorsque la récupération des statistiques échoue
 * 
 * @returns Object contenant des statistiques simulées
 */
export const generateSimulatedStats = (): Record<string, any> => {
  // Nombre de destinataires aléatoire entre 100 et 10000
  const subscriberCount = Math.floor(Math.random() * 9900) + 100;
  
  // Taux de livraison entre 90% et 99%
  const deliveryRate = (Math.random() * 9) + 90;
  const deliveredCount = Math.floor(subscriberCount * (deliveryRate / 100));
  
  // Taux d'ouverture entre 10% et 35%
  const openRate = (Math.random() * 25) + 10;
  const openCount = Math.floor(deliveredCount * (openRate / 100));
  
  // Taux de clic entre 2% et 15% des ouvertures
  const clickRate = (Math.random() * 13) + 2;
  const clickCount = Math.floor(openCount * (clickRate / 100));
  
  // Taux de bounce entre 0.5% et 5%
  const bounceRate = (Math.random() * 4.5) + 0.5;
  const bounceCount = Math.floor(subscriberCount * (bounceRate / 100));
  
  // Taux de désabonnement entre 0.1% et 2%
  const unsubRate = (Math.random() * 1.9) + 0.1;
  const unsubCount = Math.floor(deliveredCount * (unsubRate / 100));
  
  return {
    subscriber_count: subscriberCount,
    delivered_count: deliveredCount,
    delivered_rate: deliveryRate,
    open_count: openCount,
    open_rate: openRate,
    click_count: clickCount,
    click_rate: clickRate,
    bounce_count: bounceCount,
    bounce_rate: bounceRate,
    unsubscribe_count: unsubCount,
    unsubscribe_rate: unsubRate,
    // Format compatible avec delivery_info
    delivery_info: {
      total: subscriberCount,
      delivered: deliveredCount,
      delivery_rate: deliveryRate,
      opened: openCount,
      unique_open_rate: openRate,
      clicked: clickCount,
      click_rate: clickRate,
      bounced: {
        soft: Math.floor(bounceCount * 0.7),
        hard: Math.floor(bounceCount * 0.3),
        total: bounceCount
      },
      unsubscribed: unsubCount,
      complained: Math.floor(unsubCount * 0.1)
    }
  };
};
