import { AcelleCampaign } from "@/types/acelle.types";

export const calculateStatusCounts = (campaigns: AcelleCampaign[]) => {
  const counts: Record<string, number> = {
    "new": 0,
    "queued": 0,
    "sending": 0,
    "sent": 0,
    "paused": 0,
    "failed": 0
  };
  
  campaigns.forEach(campaign => {
    if (campaign.status in counts) {
      counts[campaign.status]++;
    }
  });
  
  return Object.entries(counts).map(([status, count]) => ({
    status: translateStatus(status),
    count
  }));
};

export const calculateDeliveryStats = (campaigns: AcelleCampaign[]) => {
  if (!campaigns || campaigns.length === 0) {
    console.log("[calculateDeliveryStats] Aucune campagne fournie");
    return [
      { name: "Envoyés", value: 0 },
      { name: "Livrés", value: 0 },
      { name: "Ouverts", value: 0 },
      { name: "Cliqués", value: 0 },
      { name: "Bounces", value: 0 }
    ];
  }

  console.log(`[calculateDeliveryStats] Calculing stats for ${campaigns.length} campaigns`);
  
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  campaigns.forEach(campaign => {
    // Vérifions d'abord si la campagne est définie
    if (!campaign) {
      console.warn("[calculateDeliveryStats] Campaign undefined");
      return;
    }

    // Log pour déboguer
    const campaignId = campaign.uid || campaign.campaign_uid || 'unknown';
    
    if (campaign.statistics && typeof campaign.statistics === 'object') {
      const stats = campaign.statistics;
      
      // Utiliser des valeurs par défaut pour éviter les erreurs
      totalSent += typeof stats.subscriber_count === 'number' ? stats.subscriber_count : 0;
      totalDelivered += typeof stats.delivered_count === 'number' ? stats.delivered_count : 0;
      totalOpened += typeof stats.open_count === 'number' ? stats.open_count : 0;
      totalClicked += typeof stats.click_count === 'number' ? stats.click_count : 0;
      totalBounced += typeof stats.bounce_count === 'number' ? stats.bounce_count : 0;
    }
    // Utiliser delivery_info si statistics n'existe pas
    else if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
      const info = campaign.delivery_info;
      
      // Utiliser des valeurs par défaut pour éviter les erreurs
      totalSent += typeof info.total === 'number' ? info.total : 0;
      totalDelivered += typeof info.delivered === 'number' ? info.delivered : 0;
      totalOpened += typeof info.opened === 'number' ? info.opened : 0;
      totalClicked += typeof info.clicked === 'number' ? info.clicked : 0;
      
      // Vérifiez les bounces
      if (info.bounced) {
        if (typeof info.bounced === 'object' && 'total' in info.bounced) {
          totalBounced += typeof info.bounced.total === 'number' ? info.bounced.total : 0;
        } else if (typeof info.bounced === 'number') {
          totalBounced += info.bounced;
        }
      }
    }
  });
  
  // Log des statistiques calculées
  console.log('[calculateDeliveryStats] Statistiques calculées:', { 
    totalSent, totalDelivered, totalOpened, totalClicked, totalBounced 
  });
  
  return [
    { name: "Envoyés", value: totalSent },
    { name: "Livrés", value: totalDelivered },
    { name: "Ouverts", value: totalOpened },
    { name: "Cliqués", value: totalClicked },
    { name: "Bounces", value: totalBounced }
  ];
};

export const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    "new": "Nouveau",
    "queued": "En attente",
    "sending": "En envoi",
    "sent": "Envoyé",
    "paused": "En pause",
    "failed": "Échoué"
  };
  
  return translations[status] || status;
};
