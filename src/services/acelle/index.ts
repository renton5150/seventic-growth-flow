
import { 
  getAcelleAccounts, 
  createAcelleAccount, 
  updateAcelleAccount, 
  deleteAcelleAccount,
  getActiveAccount,
  getAcelleAccountById
} from "./api/accounts";

import { 
  getCampaigns, 
  getCampaign, 
  forceSyncCampaigns
} from "./api/campaigns";

import { 
  fetchAndProcessCampaignStats, 
  enrichCampaignsWithStats 
} from "./api/stats/campaignStats";

import { checkAcelleConnectionStatus } from "./api/connection";
import { buildProxyUrl } from "./acelle-service";

export const acelleService = {
  accounts: {
    fetchAll: getAcelleAccounts,
    create: createAcelleAccount,
    update: updateAcelleAccount,
    delete: deleteAcelleAccount,
    getActive: getActiveAccount,
    getById: getAcelleAccountById
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
