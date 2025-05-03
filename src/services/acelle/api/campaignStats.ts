
// Ce fichier est maintenant réorganisé en modules plus petits
// Il exporte toutes les fonctionnalités pour maintenir la compatibilité avec le code existant

import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { fetchAndProcessCampaignStats } from "./statsCore";
import { generateSimulatedStats } from "./statsGeneration";
import { normalizeStatistics, processApiStats } from "./statsNormalization";
import { hasValidStatistics } from "./statsValidation";
import { createEmptyStatistics, createEmptyDeliveryInfo, ensureDataConsistency } from "./statsUtils";

// Réexporter toutes les fonctions pour maintenir la compatibilité avec le code existant
export {
  fetchAndProcessCampaignStats,
  generateSimulatedStats,
  normalizeStatistics,
  processApiStats,
  hasValidStatistics,
  createEmptyStatistics,
  createEmptyDeliveryInfo,
  ensureDataConsistency
};

// Interface FetchStatsOptions pour la compatibilité avec le code existant
export interface FetchStatsOptions {
  demoMode?: boolean;
  useCache?: boolean;
  skipProcessing?: boolean;
  forceRefresh?: boolean;
}
