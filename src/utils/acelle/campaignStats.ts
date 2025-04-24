
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
  let totalSent = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  // Debug log pour voir les données des campagnes
  console.log("calculateDeliveryStats - processing campaigns:", campaigns.length);
  
  campaigns.forEach(campaign => {
    // Vérifiez si delivery_info existe et n'est pas null ou undefined
    if (campaign.delivery_info) {
      console.log(`Campaign ${campaign.name} delivery info:`, campaign.delivery_info);
      
      // Utilisez les statistiques ou 0 si non disponibles
      totalSent += campaign.delivery_info.total || 0;
      totalOpened += campaign.delivery_info.opened || 0;
      totalClicked += campaign.delivery_info.clicked || 0;
      
      // Gérez les bounces qui peuvent être dans un sous-objet
      const softBounce = campaign.delivery_info.bounced?.soft || 0;
      const hardBounce = campaign.delivery_info.bounced?.hard || 0;
      totalBounced += softBounce + hardBounce;
    } else if (campaign.statistics) {
      // Fallback sur les statistiques directes si disponibles
      console.log(`Campaign ${campaign.name} statistics:`, campaign.statistics);
      
      totalSent += campaign.statistics.subscriber_count || 0;
      totalOpened += campaign.statistics.open_count || 0;
      totalClicked += campaign.statistics.click_count || 0;
      totalBounced += campaign.statistics.bounce_count || 0;
    }
  });
  
  console.log("Final calculated stats:", {
    totalSent, totalOpened, totalClicked, totalBounced
  });
  
  return [
    { name: "Envoyés", value: totalSent },
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
