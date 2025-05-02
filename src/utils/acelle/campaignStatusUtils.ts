
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
    "unknown": "Inconnu"
  };
  
  return translations[status.toLowerCase()] || status;
};

// Obtenir la variante de badge appropriée selon le statut
export const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
  switch (status.toLowerCase()) {
    case "sent":
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
    // Vérifier dans delivery_info (structure standard de l'API Acelle)
    if (campaign.delivery_info) {
      // Cas spéciaux pour les statistiques de bounce
      if (key === 'bounce_count' && campaign.delivery_info.bounced) {
        return typeof campaign.delivery_info.bounced.total === 'number' 
          ? campaign.delivery_info.bounced.total 
          : (typeof campaign.delivery_info.bounced === 'number' ? campaign.delivery_info.bounced : 0);
      }
      
      // Mappage des clés pour delivery_info (format API vers format interne)
      const deliveryInfoMap: Record<string, string> = {
        'subscriber_count': 'total',
        'delivered_count': 'delivered',
        'open_count': 'opened',
        'click_count': 'clicked',
        'uniq_open_rate': 'unique_open_rate',
        'click_rate': 'click_rate'
      };
      
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
