
// Re-export everything from the new structure
export * from './stats';

// Import all the dependent modules to avoid breaking references
import './stats/statsCache';
import './stats/statsMapper';
import './stats/singleCampaignStats';
import './stats/bulkCampaignStats';

// This file exists to maintain backward compatibility
// Moving forward, code should import directly from the new structure
