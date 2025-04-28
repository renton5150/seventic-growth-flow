
export * from './api/accounts';
export * from './api/campaigns';
export * from './api/connection';
export * from './acelle-service';

// Export as a service object
import * as accounts from './api/accounts';
import * as campaigns from './api/campaigns';
import * as connection from './api/connection';
import { acelleService as service } from './acelle-service';

export const acelleService = service;

export default acelleService;
