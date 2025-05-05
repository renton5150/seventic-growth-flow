
import { AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Interface for cache options
 */
export interface StatsFetchOptions {
  refresh?: boolean;
  demoMode?: boolean;
}

/**
 * Result of fetching campaign statistics
 */
export interface CampaignStatsResult {
  statistics: AcelleCampaignStatistics;
  delivery_info: any;
}
