
import { AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Convertit les statistiques API en modèle AcelleCampaignStatistics
 */
export const mapApiStatsToModel = (
  apiStats: any, 
  campaignUid: string
): AcelleCampaignStatistics => {
  try {
    // Si l'API retourne directement des statistiques dans le bon format
    if (apiStats.statistics) {
      return apiStats.statistics as AcelleCampaignStatistics;
    }
    
    // Sinon, essayer de mapper manuellement
    const mappedStats: AcelleCampaignStatistics = {
      subscriber_count: parseInt(apiStats.subscriber_count || apiStats.total || '0'),
      delivered_count: parseInt(apiStats.delivered_count || apiStats.delivered || '0'),
      delivered_rate: parseFloat(apiStats.delivered_rate || apiStats.delivery_rate || '0'),
      open_count: parseInt(apiStats.open_count || apiStats.opened || '0'),
      uniq_open_count: parseInt(apiStats.uniq_open_count || apiStats.unique_opens || '0'),
      uniq_open_rate: parseFloat(apiStats.uniq_open_rate || apiStats.unique_open_rate || '0'),
      click_count: parseInt(apiStats.click_count || apiStats.clicked || '0'),
      click_rate: parseFloat(apiStats.click_rate || '0'),
      bounce_count: parseInt(apiStats.bounce_count || (apiStats.bounced?.total) || '0'),
      soft_bounce_count: parseInt(apiStats.soft_bounce_count || (apiStats.bounced?.soft) || '0'),
      hard_bounce_count: parseInt(apiStats.hard_bounce_count || (apiStats.bounced?.hard) || '0'),
      unsubscribe_count: parseInt(apiStats.unsubscribe_count || apiStats.unsubscribed || '0'),
      abuse_complaint_count: parseInt(apiStats.abuse_complaint_count || apiStats.complained || '0')
    };
    
    return mappedStats;
  } catch (error) {
    console.error(`Erreur lors du mapping des statistiques pour ${campaignUid}:`, error);
    return {} as AcelleCampaignStatistics;
  }
};
