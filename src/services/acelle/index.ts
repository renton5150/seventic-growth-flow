
// Exporter les modules individuellement
export * from './api/accounts';
export * from './api/campaigns';
export * from './api/connection';

// Créer et exporter un service combiné
import * as accounts from './api/accounts';
import * as campaigns from './api/campaigns';
import * as connection from './api/connection';

// Exporter le service combiné sous un seul nom
export const acelleService = {
  ...accounts,
  ...campaigns,
  ...connection
};

// Exporter par défaut pour plus de facilité d'importation
export default acelleService;
