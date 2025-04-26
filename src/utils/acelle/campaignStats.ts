
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
  
  if (!Array.isArray(campaigns)) {
    console.error("Invalid campaigns data for status counts:", campaigns);
    return Object.entries(counts).map(([status, count]) => ({
      status: translateStatus(status),
      count
    }));
  }
  
  campaigns.forEach(campaign => {
    if (campaign && campaign.status in counts) {
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
  
  // Add validation to ensure campaigns is a valid array
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
  console.log(`Processing ${campaigns.length} campaigns for statistics`);
  
  campaigns.forEach(campaign => {
    // Skip invalid campaigns
    if (!campaign || typeof campaign !== 'object') {
      console.warn("Invalid campaign object skipped");
      return;
    }
    
    try {
      // Prioritize delivery_info as it's our primary structure
      if (campaign.delivery_info) {
        // Ensure all values are numbers
        totalSent += ensureNumber(campaign.delivery_info.total);
        totalDelivered += ensureNumber(campaign.delivery_info.delivered);
        totalOpened += ensureNumber(campaign.delivery_info.opened);
        totalClicked += ensureNumber(campaign.delivery_info.clicked);
        
        // Handle bounces from the bounced subobject
        const softBounce = ensureNumber(campaign.delivery_info.bounced?.soft);
        const hardBounce = ensureNumber(campaign.delivery_info.bounced?.hard);
        totalBounced += softBounce + hardBounce;
      } 
      // Fall back to statistics if available
      else if (campaign.statistics) {
        totalSent += ensureNumber(campaign.statistics.subscriber_count);
        totalDelivered += ensureNumber(campaign.statistics.delivered_count);
        totalOpened += ensureNumber(campaign.statistics.open_count);
        totalClicked += ensureNumber(campaign.statistics.click_count);
        totalBounced += ensureNumber(campaign.statistics.bounce_count);
      }
    } catch (error) {
      console.error(`Error processing campaign statistics for ${campaign.name || 'unnamed campaign'}:`, error);
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

// Helper function to ensure we always have valid numbers
const ensureNumber = (value?: any): number => {
  if (value === undefined || value === null) return 0;
  
  // If it's already a number, return it
  if (typeof value === 'number') return value;
  
  // If it's a string, parse it
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
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
