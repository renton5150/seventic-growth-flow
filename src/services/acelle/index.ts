
import { getAcelleAccounts, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount } from "./api/accounts";
import { getCampaigns, getCampaign, forceSyncCampaigns } from "./api/campaigns";
import { fetchAndProcessCampaignStats, enrichCampaignsWithStats } from "./api/campaignStats";
import { checkAcelleConnectionStatus } from "./api/connection";
import { buildProxyUrl } from "./acelle-service";

export const acelleService = {
  accounts: {
    fetchAll: getAcelleAccounts,
    create: createAcelleAccount,
    update: updateAcelleAccount,
    delete: deleteAcelleAccount,
    getActive: () => getAcelleAccounts().then(accounts => accounts.find(acc => acc.status === 'active') || null)
  },
  campaigns: {
    fetchAll: getCampaigns,
    fetchOne: getCampaign,
    forceSync: forceSyncCampaigns,
    getStats: fetchAndProcessCampaignStats,
    enrichWithStats: enrichCampaignsWithStats
  },
  connection: {
    checkStatus: checkAcelleConnectionStatus
  },
  utils: {
    buildProxyUrl
  }
};
