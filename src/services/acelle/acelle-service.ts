
import { getAcelleAccounts, getAcelleAccountById, createAcelleAccount, updateAcelleAccount, deleteAcelleAccount, updateLastSyncDate } from './api/accounts';
import { testAcelleConnection } from './api/connection';
import { checkApiAccess, fetchCampaignDetails, getAcelleCampaigns } from './api/campaigns';

// Export all functions under a single acelleService object
export const acelleService = {
  // Account management
  getAcelleAccounts,
  getAcelleAccountById,
  createAcelleAccount,
  updateAcelleAccount,
  deleteAcelleAccount,
  
  // Connection testing
  testAcelleConnection,
  checkApiAccess,
  
  // Campaign operations
  getAcelleCampaigns,
  fetchCampaignDetails,
  updateLastSyncDate
};

// Also export individual functions for direct imports
export {
  getAcelleAccounts,
  getAcelleAccountById,
  createAcelleAccount,
  updateAcelleAccount,
  deleteAcelleAccount,
  testAcelleConnection,
  checkApiAccess,
  getAcelleCampaigns,
  fetchCampaignDetails,
  updateLastSyncDate
};
