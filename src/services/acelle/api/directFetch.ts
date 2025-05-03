
/**
 * Ce fichier exporte les fonctionnalités de récupération directe des statistiques
 * de campagnes depuis l'API Acelle, en contournant le mécanisme de cache.
 */
import { fetchDirectCampaignStats } from "./directCampaignFetch";
import { refreshCampaignStatsBatch, refreshAllCampaignStats } from "./batchOperations";

// Ré-exporter les fonctions pour maintenir la compatibilité avec le code existant
export { 
  fetchDirectCampaignStats,
  refreshCampaignStatsBatch,
  refreshAllCampaignStats
};
