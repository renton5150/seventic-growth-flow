
import { AcelleCampaign } from "@/types/acelle.types";

export const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    "new": "default",
    "queued": "secondary",
    "sending": "secondary", // 'warning' is not a valid variant, use secondary
    "sent": "default",      // 'success' is not a valid variant, use default
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

// Enhanced helper to safely get numeric values with multiple fallbacks
const safeGetNumber = (paths: any[][], obj: any): number => {
  for (const path of paths) {
    try {
      let value = obj;
      for (const key of path) {
        if (value === undefined || value === null || typeof value !== 'object') {
          break;
        }
        value = value[key];
      }
      
      if (value !== undefined && value !== null) {
        const num = Number(value);
        if (!isNaN(num)) return num;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  return 0;
};

export const calculateDeliveryStats = (campaigns: AcelleCampaign[]) => {
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  campaigns.forEach(campaign => {
    // Get total sent with fallbacks
    totalSent += safeGetNumber([
      ['delivery_info', 'total'], 
      ['statistics', 'subscriber_count'],
      ['meta', 'subscribers_count']
    ], campaign);
    
    // Get delivered with fallbacks
    totalDelivered += safeGetNumber([
      ['delivery_info', 'delivered'], 
      ['statistics', 'delivered_count']
    ], campaign);
    
    // Get opened with fallbacks
    totalOpened += safeGetNumber([
      ['delivery_info', 'opened'], 
      ['statistics', 'open_count']
    ], campaign);
    
    // Get clicked with fallbacks
    totalClicked += safeGetNumber([
      ['delivery_info', 'clicked'], 
      ['statistics', 'click_count']
    ], campaign);
    
    // Get bounces with fallbacks
    totalBounced += safeGetNumber([
      ['delivery_info', 'bounced', 'total'], 
      ['delivery_info', 'bounced', 'soft'],
      ['delivery_info', 'bounced', 'hard'],
      ['statistics', 'bounce_count']
    ], campaign);
  });
  
  return [
    { name: "Envoyés", value: totalSent },
    { name: "Livrés", value: totalDelivered },
    { name: "Ouverts", value: totalOpened },
    { name: "Cliqués", value: totalClicked },
    { name: "Bounces", value: totalBounced }
  ];
};
