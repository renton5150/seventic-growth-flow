
import { AcelleCampaign } from "@/types/acelle.types";

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

export const renderPercentage = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return "0.00%";
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return "0.00%";
  
  return `${numValue.toFixed(2)}%`;
};

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
  
  campaigns.forEach(campaign => {
    // Helper to safely extract numbers
    const safeNumber = (value: any): number => {
      if (value === undefined || value === null) return 0;
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };
    
    // Process statistics from any available source
    if (campaign.delivery_info) {
      totalSent += safeNumber(campaign.delivery_info.total);
      totalDelivered += safeNumber(campaign.delivery_info.delivered);
      totalOpened += safeNumber(campaign.delivery_info.opened);
      totalClicked += safeNumber(campaign.delivery_info.clicked);
      
      // Extract bounces
      const softBounce = safeNumber(campaign.delivery_info.bounced?.soft);
      const hardBounce = safeNumber(campaign.delivery_info.bounced?.hard);
      const totalBouncesInfo = safeNumber(campaign.delivery_info.bounced?.total);
      
      // Use the specific bounce counts if available, otherwise use the total
      totalBounced += softBounce + hardBounce > 0 ? softBounce + hardBounce : totalBouncesInfo;
    } 
    // Fall back to statistics if delivery_info is not available
    else if (campaign.statistics) {
      totalSent += safeNumber(campaign.statistics.subscriber_count);
      totalDelivered += safeNumber(campaign.statistics.delivered_count);
      totalOpened += safeNumber(campaign.statistics.open_count);
      totalClicked += safeNumber(campaign.statistics.click_count);
      totalBounced += safeNumber(campaign.statistics.bounce_count);
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
