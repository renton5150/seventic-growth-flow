
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

  console.log(`[calculateDeliveryStats] Calcul des stats pour ${campaigns.length} campagnes`);
  
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  campaigns.forEach(campaign => {
    // Vérifier si les statistiques ou delivery_info sont présents
    if (campaign.statistics) {
      totalSent += Number(campaign.statistics.subscriber_count) || 0;
      totalDelivered += Number(campaign.statistics.delivered_count) || 0;
      totalOpened += Number(campaign.statistics.open_count) || 0;
      totalClicked += Number(campaign.statistics.click_count) || 0;
      totalBounced += Number(campaign.statistics.bounce_count) || 0;
    } 
    // Utiliser delivery_info si statistics n'existe pas
    else if (campaign.delivery_info) {
      totalSent += Number(campaign.delivery_info.total) || 0;
      totalDelivered += Number(campaign.delivery_info.delivered) || 0;
      totalOpened += Number(campaign.delivery_info.opened) || 0;
      totalClicked += Number(campaign.delivery_info.clicked) || 0;
      
      // Gérer le cas où bounced est soit un nombre soit un objet
      if (typeof campaign.delivery_info.bounced === 'number') {
        totalBounced += campaign.delivery_info.bounced;
      } else if (campaign.delivery_info.bounced && typeof campaign.delivery_info.bounced === 'object') {
        totalBounced += Number(campaign.delivery_info.bounced.total) || 0;
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
