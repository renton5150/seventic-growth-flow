
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

// Fonction utilitaire pour extraire les statistiques de manière sécurisée
export const extractCampaignStat = (campaign: any, key: string): number => {
  try {
    // Essayer d'abord avec delivery_info
    if (campaign?.delivery_info) {
      // Cas spéciaux pour les statistiques de bounce
      if (key === 'bounce_count' && campaign.delivery_info.bounced) {
        return typeof campaign.delivery_info.bounced.total === 'number' ? campaign.delivery_info.bounced.total : 0;
      }
      
      // Mapping des clés pour delivery_info
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
        return campaign.delivery_info[mappedKey] as number;
      }
    }
    
    // Puis essayer avec statistics
    if (campaign?.statistics && typeof campaign.statistics[key] === 'number') {
      return campaign.statistics[key] as number;
    }
    
    // Fallback à 0 si rien n'est trouvé
    return 0;
  } catch (error) {
    console.warn(`Erreur lors de l'extraction de ${key}:`, error);
    return 0;
  }
};
