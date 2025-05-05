
import { fetchAcelleAccounts, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount, getActiveAccount } from "./api/accounts";
import { fetchCampaigns, fetchCampaign, forceSyncCampaigns } from "./api/campaigns";
import { fetchAndProcessCampaignStats, enrichCampaignsWithStats } from "./api/campaignStats";
import { checkConnectionStatus } from "./api/connection";
import { buildProxyUrl } from "./acelle-service";

export const acelleService = {
  accounts: {
    fetchAll: fetchAcelleAccounts,
    create: createAcelleAccount,
    update: updateAcelleAccount,
    delete: deleteAcelleAccount,
    getActive: getActiveAccount
  },
  campaigns: {
    fetchAll: fetchCampaigns,
    fetchOne: fetchCampaign,
    forceSync: forceSyncCampaigns,
    getStats: fetchAndProcessCampaignStats,
    enrichWithStats: enrichCampaignsWithStats
  },
  connection: {
    checkStatus: checkConnectionStatus
  },
  utils: {
    buildProxyUrl
  }
};
