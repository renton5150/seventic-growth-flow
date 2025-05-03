
import { AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { createEmptyStatistics, createEmptyDeliveryInfo } from "./statsUtils";

/**
 * Génère des statistiques simulées pour le mode démonstration
 */
export const generateSimulatedStats = () => {
  // Générer des statistiques réalistes
  const totalSent = 1000 + Math.floor(Math.random() * 1000);
  const delivered = totalSent - Math.floor(Math.random() * 100);
  const opened = Math.floor(delivered * (0.2 + Math.random() * 0.4)); // entre 20% et 60%
  const clicked = Math.floor(opened * (0.1 + Math.random() * 0.3)); // entre 10% et 40% des ouvertures
  const bounced = totalSent - delivered;
  const softBounces = Math.floor(bounced * 0.7);
  const hardBounces = bounced - softBounces;
  const unsubscribed = Math.floor(delivered * 0.01); // environ 1%
  const complaints = Math.floor(unsubscribed * 0.1);
  
  // Créer les objets de stats
  const statistics: AcelleCampaignStatistics = {
    subscriber_count: totalSent,
    delivered_count: delivered,
    delivered_rate: (delivered / totalSent) * 100,
    open_count: opened,
    uniq_open_rate: (opened / delivered) * 100,
    click_count: clicked,
    click_rate: (clicked / delivered) * 100,
    bounce_count: bounced,
    soft_bounce_count: softBounces,
    hard_bounce_count: hardBounces,
    unsubscribe_count: unsubscribed,
    abuse_complaint_count: complaints
  };
  
  const deliveryInfo: DeliveryInfo = {
    total: totalSent,
    delivered,
    delivery_rate: (delivered / totalSent) * 100,
    opened,
    unique_open_rate: (opened / delivered) * 100,
    clicked,
    click_rate: (clicked / delivered) * 100,
    bounced: {
      soft: softBounces,
      hard: hardBounces,
      total: bounced
    },
    unsubscribed,
    complained: complaints
  };
  
  return { statistics, delivery_info: deliveryInfo };
};
