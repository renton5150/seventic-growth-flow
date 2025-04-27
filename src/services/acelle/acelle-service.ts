
import { AcelleAccount, AcelleConnectionDebug, AcelleCampaignDetail } from "@/types/acelle.types";

/**
 * This is a placeholder service for functions related to Acelle Mail that were removed
 * It allows the UI to continue functioning without actually making API calls
 */

export const getAcelleAccounts = async (): Promise<AcelleAccount[]> => {
  console.warn("getAcelleAccounts: Email campaign functionality has been removed");
  return [];
};

export const updateAcelleAccount = async (account: AcelleAccount): Promise<AcelleAccount> => {
  console.warn("updateAcelleAccount: Email campaign functionality has been removed");
  return account;
};

export const testAcelleConnection = async (
  endpoint: string,
  token: string,
  debug = false
): Promise<boolean | AcelleConnectionDebug> => {
  console.warn("testAcelleConnection: Email campaign functionality has been removed");
  return {
    success: false,
    message: "Email campaign functionality has been removed from the application.",
    error: "Service unavailable",
    request: {
      url: `${endpoint}/sample-path`,
      method: "GET",
      headers: { "Content-Type": "application/json" }
    },
    responseData: {
      statusCode: 404,
      message: "Email campaign functionality has been removed",
      error: "Service unavailable"
    }
  };
};

export const acelleService = {
  getAcelleCampaigns: async () => {
    console.warn("getAcelleCampaigns: Email campaign functionality has been removed");
    return [];
  },
  getAcelleCampaignDetails: async (account: AcelleAccount, campaignUid: string): Promise<AcelleCampaignDetail> => {
    console.warn("getAcelleCampaignDetails: Email campaign functionality has been removed");
    return {
      id: campaignUid,
      uid: campaignUid,
      name: "Removed Campaign",
      subject: "Removed",
      status: "removed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      run_at: new Date().toISOString(),
      html: "<p>Email campaign functionality has been removed</p>",
      plain: "Email campaign functionality has been removed",
      tracking: {
        open_tracking: false,
        click_tracking: false
      },
      delivery_info: {
        total: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: {
          total: 0,
          hard: 0,
          soft: 0
        },
        unsubscribed: 0,
        complained: 0,
        delivery_rate: 0,
        open_rate: 0,
        click_rate: 0,
        unsubscribe_rate: 0,
        unique_open_rate: 0
      }
    };
  }
};
