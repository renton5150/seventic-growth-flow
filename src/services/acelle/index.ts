
export * from './api/accounts';
export * from './api/campaigns';
export * from './api/connection';

// Export as a service object
import * as accounts from './api/accounts';
import * as campaigns from './api/campaigns';
import * as connection from './api/connection';

export const acelleService = {
  ...accounts,
  ...campaigns,
  ...connection
};

export default acelleService;

