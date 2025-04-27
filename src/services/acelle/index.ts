
export * from './api/accounts';
export * from './api/campaigns';
export * from './api/connection';

// Export as a single service object
import * as accounts from './api/accounts';
import * as campaigns from './api/campaigns';
import * as connection from './api/connection';

// Create a single service object that combines all the APIs
export const acelleService = {
  ...accounts,
  ...campaigns,
  ...connection
};

// Export default for easier imports
export default acelleService;
