
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

// For backward compatibility with existing code
const acelleServiceInstance = {
  ...accounts,
  ...campaigns,
  ...connection
};

export { acelleServiceInstance as acelleService };
export default acelleService;
