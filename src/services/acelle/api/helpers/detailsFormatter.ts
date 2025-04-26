
import { AcelleCampaignDetail } from "@/types/acelle.types";

export const formatCampaignDetails = (campaignDetails: any): AcelleCampaignDetail => {
  return {
    ...campaignDetails,
    statistics: campaignDetails.statistics || {},
    delivery_info: campaignDetails.delivery_info || {
      total: parseInt(campaignDetails.statistics?.subscriber_count) || 0,
      delivery_rate: parseFloat(campaignDetails.statistics?.delivered_rate) || 0,
      unique_open_rate: parseFloat(campaignDetails.statistics?.uniq_open_rate) || 0,
      click_rate: parseFloat(campaignDetails.statistics?.click_rate) || 0,
      bounce_rate: parseFloat(campaignDetails.statistics?.bounce_rate) || 0,
      unsubscribe_rate: parseFloat(campaignDetails.statistics?.unsubscribe_rate) || 0,
      delivered: parseInt(campaignDetails.statistics?.delivered_count) || 0,
      opened: parseInt(campaignDetails.statistics?.open_count) || 0,
      clicked: parseInt(campaignDetails.statistics?.click_count) || 0,
      bounced: {
        soft: parseInt(campaignDetails.statistics?.soft_bounce_count) || 0,
        hard: parseInt(campaignDetails.statistics?.hard_bounce_count) || 0,
        total: parseInt(campaignDetails.statistics?.bounce_count) || 0
      },
      unsubscribed: parseInt(campaignDetails.statistics?.unsubscribe_count) || 0,
      complained: parseInt(campaignDetails.statistics?.abuse_complaint_count) || 0
    }
  };
};
