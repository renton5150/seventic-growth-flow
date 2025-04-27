
import { AcelleAccount, AcelleCampaign, AcelleCampaignDetail } from "@/types/acelle.types";
import { toast } from "sonner";

// Get campaigns for an account with pagination
export const getAcelleCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
  try {
    console.log(`Fetching campaigns for account ${account.name}`);
    
    // This is a placeholder implementation that returns empty data
    // since we don't want to actually implement the feature
    return [];
  } catch (error) {
    console.error(`Error fetching campaigns for account ${account.id}:`, error);
    toast.error(`Erreur lors du chargement des campagnes: ${error.message || "Erreur inconnue"}`);
    return [];
  }
};

// Get campaign details
export const getAcelleCampaignDetails = async (account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail | null> => {
  try {
    console.log(`Fetching details for campaign ${campaignUid}`);
    
    // This is a placeholder implementation that returns null
    // since we don't want to actually implement the feature
    return null;
  } catch (error) {
    console.error(`Error fetching campaign details ${campaignUid}:`, error);
    toast.error(`Erreur lors du chargement des détails: ${error.message || "Erreur inconnue"}`);
    return null;
  }
};
