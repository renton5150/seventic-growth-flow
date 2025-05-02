
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
  // Log pour déboguer
  console.log(`Calculating delivery stats for ${campaigns.length} campaigns`);
  
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  campaigns.forEach(campaign => {
    // Amélioration: vérifier les types avant d'accéder aux propriétés
    if (!campaign) {
      console.warn("Campaign object is undefined or null in calculateDeliveryStats");
      return;
    }

    // Prioritize delivery_info as it's our primary structure
    if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
      const info = campaign.delivery_info;
      
      // Utiliser des valeurs par défaut pour éviter les erreurs
      totalSent += typeof info.total === 'number' ? info.total : 0;
      totalDelivered += typeof info.delivered === 'number' ? info.delivered : 0;
      totalOpened += typeof info.opened === 'number' ? info.opened : 0;
      totalClicked += typeof info.clicked === 'number' ? info.clicked : 0;
      
      // Handle bounces from the bounced subobject
      if (info.bounced && typeof info.bounced === 'object') {
        const softBounce = typeof info.bounced.soft === 'number' ? info.bounced.soft : 0;
        const hardBounce = typeof info.bounced.hard === 'number' ? info.bounced.hard : 0;
        totalBounced += softBounce + hardBounce;
      }
    } 
    // Fall back to statistics if available
    else if (campaign.statistics && typeof campaign.statistics === 'object') {
      const stats = campaign.statistics;
      
      totalSent += typeof stats.subscriber_count === 'number' ? stats.subscriber_count : 0;
      totalDelivered += typeof stats.delivered_count === 'number' ? stats.delivered_count : 0;
      totalOpened += typeof stats.open_count === 'number' ? stats.open_count : 0;
      totalClicked += typeof stats.click_count === 'number' ? stats.click_count : 0;
      totalBounced += typeof stats.bounce_count === 'number' ? stats.bounce_count : 0;
    }
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
