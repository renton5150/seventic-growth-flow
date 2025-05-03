
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
  console.log(`[calculateDeliveryStats] Calculing stats for ${campaigns.length} campaigns`);
  
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  campaigns.forEach(campaign => {
    // Vérifions si la campagne est définie
    if (!campaign) {
      console.warn("[calculateDeliveryStats] Campaign undefined");
      return;
    }

    // Log pour déboguer
    const campaignId = campaign.uid || campaign.campaign_uid || 'unknown';
    console.log(`[calculateDeliveryStats] Processing campaign ${campaignId}`, { 
      hasStats: !!campaign.statistics,
      hasDeliveryInfo: !!campaign.delivery_info
    });

    // Priorité 1: Utiliser les statistiques s'ils existent
    if (campaign.statistics && typeof campaign.statistics === 'object') {
      const stats = campaign.statistics;
      console.log(`[calculateDeliveryStats] Using statistics for ${campaignId}`, stats);
      
      // Utiliser des valeurs par défaut pour éviter les erreurs
      if (typeof stats.subscriber_count === 'number') totalSent += stats.subscriber_count;
      if (typeof stats.delivered_count === 'number') totalDelivered += stats.delivered_count;
      if (typeof stats.open_count === 'number') totalOpened += stats.open_count;
      if (typeof stats.click_count === 'number') totalClicked += stats.click_count;
      if (typeof stats.bounce_count === 'number') totalBounced += stats.bounce_count;
    }
    // Priorité 2: Utiliser delivery_info si statistics n'existe pas
    else if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
      const info = campaign.delivery_info;
      console.log(`[calculateDeliveryStats] Using delivery_info for ${campaignId}`, info);
      
      // Utiliser des valeurs par défaut pour éviter les erreurs
      if (typeof info.total === 'number') totalSent += info.total;
      if (typeof info.delivered === 'number') totalDelivered += info.delivered;
      if (typeof info.opened === 'number') totalOpened += info.opened;
      if (typeof info.clicked === 'number') totalClicked += info.clicked;
      
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
  console.log('[calculateDeliveryStats] Calculated totals:', { 
    totalSent, totalDelivered, totalOpened, totalClicked, totalBounced 
  });
  
  // Return au format attendu par CampaignSummaryStats
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
