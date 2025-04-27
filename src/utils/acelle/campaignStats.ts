
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
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  // Debug log pour voir les données des campagnes
  console.log("calculateDeliveryStats - processing campaigns:", campaigns.length);
  
  campaigns.forEach(campaign => {
    // Prioritize delivery_info as it's our primary structure
    if (campaign.delivery_info) {
      console.log(`Campaign ${campaign.name} delivery info:`, campaign.delivery_info);
      
      // Use existing delivery_info structure
      totalSent += campaign.delivery_info.total || 0;
      totalDelivered += campaign.delivery_info.delivered || 0;
      totalOpened += campaign.delivery_info.opened || 0;
      totalClicked += campaign.delivery_info.clicked || 0;
      
      // Handle bounces from the bounced subobject
      const softBounce = campaign.delivery_info.bounced?.soft || 0;
      const hardBounce = campaign.delivery_info.bounced?.hard || 0;
      totalBounced += softBounce + hardBounce;
    } 
    // Fall back to statistics if available
    else if (campaign.statistics) {
      console.log(`Campaign ${campaign.name} statistics:`, campaign.statistics);
      
      totalSent += campaign.statistics.subscriber_count || 0;
      totalDelivered += campaign.statistics.delivered_count || 0;
      totalOpened += campaign.statistics.open_count || 0;
      totalClicked += campaign.statistics.click_count || 0;
      totalBounced += campaign.statistics.bounce_count || 0;
    }
  });
  
  console.log("Final calculated stats:", {
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
