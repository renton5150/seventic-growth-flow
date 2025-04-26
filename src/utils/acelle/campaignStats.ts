
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
  
  // Ajouter une vérification pour s'assurer que campaigns est un tableau valide
  if (!Array.isArray(campaigns)) {
    console.error("calculateDeliveryStats - invalid campaigns data:", campaigns);
    return [
      { name: "Envoyés", value: 0 },
      { name: "Livrés", value: 0 },
      { name: "Ouverts", value: 0 },
      { name: "Cliqués", value: 0 },
      { name: "Bounces", value: 0 }
    ];
  }
  
  // Debug log for campaign data
  console.log("calculateDeliveryStats - processing campaigns:", campaigns.length);
  
  campaigns.forEach(campaign => {
    // Log each campaign's delivery data for debugging
    console.log(`Campaign ${campaign.name || 'unnamed'} - status: ${campaign.status}, delivery info:`, 
      campaign.delivery_info ? JSON.stringify(campaign.delivery_info).substring(0, 100) + '...' : 'undefined');
    
    // Vérifier que campaign est un objet valide
    if (!campaign || typeof campaign !== 'object') {
      console.warn("Invalid campaign object:", campaign);
      return;
    }
    
    // Prioritize delivery_info as it's our primary structure
    if (campaign.delivery_info) {
      // Use existing delivery_info structure
      totalSent += Number(campaign.delivery_info.total) || 0;
      totalDelivered += Number(campaign.delivery_info.delivered) || 0;
      totalOpened += Number(campaign.delivery_info.opened) || 0;
      totalClicked += Number(campaign.delivery_info.clicked) || 0;
      
      // Handle bounces from the bounced subobject
      const softBounce = Number(campaign.delivery_info.bounced?.soft) || 0;
      const hardBounce = Number(campaign.delivery_info.bounced?.hard) || 0;
      totalBounced += softBounce + hardBounce;
    } 
    // Fall back to statistics if available
    else if (campaign.statistics) {
      console.log(`Campaign ${campaign.name || 'unnamed'} - statistics fallback:`, campaign.statistics);
      
      totalSent += Number(campaign.statistics.subscriber_count) || 0;
      totalDelivered += Number(campaign.statistics.delivered_count) || 0;
      totalOpened += Number(campaign.statistics.open_count) || 0;
      totalClicked += Number(campaign.statistics.click_count) || 0;
      totalBounced += Number(campaign.statistics.bounce_count) || 0;
    }
  });
  
  console.log("Final calculated delivery stats:", {
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

export const getStatusBadgeVariant = (status: string): string => {
  const variants: Record<string, string> = {
    "new": "default",
    "queued": "secondary",
    "sending": "warning",
    "sent": "success",
    "paused": "outline",
    "failed": "destructive"
  };
  
  return variants[status] || "default";
};

export const renderPercentage = (value?: number): string => {
  if (value === undefined || value === null) return "0%";
  return `${(value * 100).toFixed(1)}%`;
};
