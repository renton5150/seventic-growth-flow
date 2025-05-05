
import { AcelleCampaign } from "@/types/acelle.types";

/**
 * Crée un objet de statistiques vide mais valide avec des valeurs par défaut
 */
export const createEmptyStatistics = () => {
  return {
    subscriber_count: 0,
    delivered_count: 0,
    delivered_rate: 0,
    open_count: 0,
    uniq_open_rate: 0,
    click_count: 0,
    click_rate: 0,
    bounce_count: 0,
    soft_bounce_count: 0,
    hard_bounce_count: 0,
    unsubscribe_count: 0,
    abuse_complaint_count: 0
  };
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

/**
 * Calcule les statistiques de livraison à partir des campagnes directement,
 * sans utiliser le cache et sans ajouter de données démo
 */
export const calculateDeliveryStats = (campaigns: AcelleCampaign[]) => {
  // Log pour déboguer
  console.log(`Calculating delivery stats for ${campaigns.length} campaigns`);
  
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  
  // Helper function to safely get a numeric value
  const safeNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = Number(value);
    return !isNaN(num) ? num : 0;
  };
  
  campaigns.forEach(campaign => {
    if (!campaign) {
      console.warn("Campaign object is undefined or null in calculateDeliveryStats");
      return;
    }

    console.log(`Processing campaign ${campaign.name || 'unknown'} with ID ${campaign.uid || 'unknown'}`);
    console.log(`Campaign has delivery_info:`, !!campaign.delivery_info);
    console.log(`Campaign has statistics:`, !!campaign.statistics);

    // Ensure we have objects to access, even if empty
    const deliveryInfo = campaign.delivery_info || {};
    const stats = campaign.statistics || {};

    // Prioritize delivery_info as it's our primary structure
    if (campaign.delivery_info && typeof campaign.delivery_info === 'object') {
      const info = campaign.delivery_info;
      console.log(`Campaign ${campaign.name} delivery_info:`, info);
      
      // Safely access numerical properties
      totalSent += safeNumber(info.total);
      totalDelivered += safeNumber(info.delivered);
      totalOpened += safeNumber(info.opened);
      totalClicked += safeNumber(info.clicked);
      
      // Handle bounces from the bounced subobject
      if (info.bounced !== undefined) {
        if (typeof info.bounced === 'object' && info.bounced !== null) {
          const softBounce = safeNumber(info.bounced.soft);
          const hardBounce = safeNumber(info.bounced.hard);
          totalBounced += softBounce + hardBounce;
        } else if (typeof info.bounced === 'number') {
          totalBounced += info.bounced;
        }
      }
    } 
    // Fall back to statistics if available
    else if (campaign.statistics && typeof campaign.statistics === 'object') {
      const stats = campaign.statistics;
      console.log(`Campaign ${campaign.name} statistics:`, stats);
      
      totalSent += safeNumber(stats.subscriber_count);
      totalDelivered += safeNumber(stats.delivered_count);
      totalOpened += safeNumber(stats.open_count);
      totalClicked += safeNumber(stats.click_count);
      totalBounced += safeNumber(stats.bounce_count);
    } else {
      console.warn(`No statistics found for campaign ${campaign.name || 'unknown'}`);
    }
  });
  
  const result = {
    totalEmails: totalSent,
    totalDelivered: totalDelivered,
    totalOpened: totalOpened,
    totalClicked: totalClicked,
    totalBounced: totalBounced
  };
  
  console.log("Final calculated stats:", result);
  
  return result;
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
