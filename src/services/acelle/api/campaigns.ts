
export * from './helpers/apiAccess';
export * from './helpers/campaignDetails';
export * from './helpers/campaignList';
export * from './helpers/detailsFormatter';

import { getAcelleCampaigns } from './helpers/campaignList';
import { fetchCampaignDetails } from './helpers/campaignDetails';
import { formatCampaignDetails } from './helpers/detailsFormatter';
import { AcelleAccount, AcelleCampaignDetail } from "@/types/acelle.types";

// Get campaign details with proper formatting
export const getAcelleCampaignDetails = async (account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail | null> => {
  const campaignDetails = await fetchCampaignDetails(account, campaignUid);
  if (!campaignDetails) return null;
  return formatCampaignDetails(campaignDetails);
};

export default {
  getAcelleCampaigns,
  getAcelleCampaignDetails,
  fetchCampaignDetails
};
