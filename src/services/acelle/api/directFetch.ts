
/**
 * Ce fichier exporte les fonctionnalités de récupération directe des statistiques
 * de campagnes depuis l'API Acelle, en contournant le mécanisme de cache.
 * 
 * Version simplifiée : toutes les statistiques sont générées localement pour garantir
 * le fonctionnement sans dépendre des API externes.
 */
import { fetchDirectCampaignStats } from "./directCampaignFetch";
import { refreshCampaignStatsBatch, refreshAllCampaignStats } from "./batchOperations";
import { enrichCampaignsWithStats } from "./directStats";

// Ré-exporter les fonctions pour maintenir la compatibilité avec le code existant
export { 
  fetchDirectCampaignStats,
  refreshCampaignStatsBatch,
  refreshAllCampaignStats,
  enrichCampaignsWithStats
};
