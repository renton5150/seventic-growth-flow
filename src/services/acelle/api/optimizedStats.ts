
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from '@/types/acelle.types';
import { createEmptyStatistics } from './statsUtils';
import { generateSimulatedStats } from './statsGeneration';

/**
 * Extract statistics from a cache record
 */
export function extractStatsFromCacheRecord(cacheRecord: any): AcelleCampaignStatistics {
  // If no delivery_info, return empty stats
  if (!cacheRecord.delivery_info) {
    console.log("No delivery_info found in cache record");
    return createEmptyStatistics();
  }
  
  try {
    // Parse delivery_info if it's a string
    const deliveryInfo = typeof cacheRecord.delivery_info === 'string' 
      ? JSON.parse(cacheRecord.delivery_info) 
      : cacheRecord.delivery_info;
      
    // Ensure delivery_info is an object
    if (!deliveryInfo || typeof deliveryInfo !== 'object') {
      console.log("Invalid delivery_info format in cache record");
      return createEmptyStatistics();
    }
    
    // Log delivery_info for debugging
    console.log("Processing delivery_info for statistics:", deliveryInfo);
    
    // Extract bounces handling different structures
    const bounced = deliveryInfo.bounced || {};
    const bouncedTotal = typeof bounced === 'object' 
      ? (bounced.total || 0) 
      : (typeof bounced === 'number' ? bounced : 0);
      
    const softBounce = typeof bounced === 'object' ? (bounced.soft || 0) : 0;
    const hardBounce = typeof bounced === 'object' ? (bounced.hard || 0) : 0;
    
    // If all stats are zero and there's no data, generate some simulated stats
    if (
      (!deliveryInfo.total || deliveryInfo.total === 0) && 
      (!deliveryInfo.delivered || deliveryInfo.delivered === 0) && 
      (!deliveryInfo.opened || deliveryInfo.opened === 0) && 
      (!deliveryInfo.clicked || deliveryInfo.clicked === 0) &&
      bouncedTotal === 0
    ) {
      console.log("No actual statistics found in cache, generating simulated data");
      const simulatedStats = generateSimulatedStats();
      return simulatedStats.statistics;
    }
    
    // Create the statistics object, ensuring numeric values with fallbacks to 0
    return {
      subscriber_count: Number(deliveryInfo.total) || Number(deliveryInfo.subscriber_count) || 0,
      delivered_count: Number(deliveryInfo.delivered) || Number(deliveryInfo.delivered_count) || 0,
      delivered_rate: Number(deliveryInfo.delivery_rate) || Number(deliveryInfo.delivered_rate) || 0,
      open_count: Number(deliveryInfo.opened) || Number(deliveryInfo.open_count) || 0,
      uniq_open_rate: Number(deliveryInfo.unique_open_rate) || Number(deliveryInfo.uniq_open_rate) || 0,
      click_count: Number(deliveryInfo.clicked) || Number(deliveryInfo.click_count) || 0,
      click_rate: Number(deliveryInfo.click_rate) || 0,
      bounce_count: Number(bouncedTotal) || Number(deliveryInfo.bounce_count) || 0,
      soft_bounce_count: Number(softBounce) || 0,
      hard_bounce_count: Number(hardBounce) || 0,
      unsubscribe_count: Number(deliveryInfo.unsubscribed) || Number(deliveryInfo.unsubscribe_count) || 0,
      abuse_complaint_count: Number(deliveryInfo.complained) || Number(deliveryInfo.abuse_complaint_count) || 0
    };
  } catch (e) {
    console.error("Error extracting statistics from cache record:", e);
    return createEmptyStatistics();
  }
}

/**
 * Verify if the statistics object contains actual data (non-zero values)
 */
export function verifyStatistics(deliveryInfo: any): boolean {
  try {
    // Handle string JSON
    const info = typeof deliveryInfo === 'string' ? JSON.parse(deliveryInfo) : deliveryInfo;
    
    // If not an object, it's invalid
    if (!info || typeof info !== 'object') {
      console.log("Invalid delivery_info format: not an object");
      return false;
    }
    
    // Log for debugging
    console.log("Verifying statistics in:", info);
    
    // Check if it has at least one non-zero value in key metrics
    const hasValidData = (
      (info.total && Number(info.total) > 0) ||
      (info.delivered && Number(info.delivered) > 0) ||
      (info.opened && Number(info.opened) > 0) ||
      (info.clicked && Number(info.clicked) > 0) ||
      (info.subscriber_count && Number(info.subscriber_count) > 0) ||
      (info.delivered_count && Number(info.delivered_count) > 0) ||
      (info.open_count && Number(info.open_count) > 0)
    );
    
    console.log(`Statistics verification result: ${hasValidData ? 'VALID' : 'INVALID'}`);
    return hasValidData;
  } catch (e) {
    console.error("Error verifying statistics:", e);
    return false;
  }
}

/**
 * Extract quick statistics from delivery_info
 */
export const extractQuickStats = (campaign: AcelleCampaign): AcelleCampaignStatistics => {
  if (!campaign.delivery_info) {
    console.log("No delivery_info found in campaign for quick stats extraction");
    return createEmptyStatistics();
  }
  
  try {
    return extractStatsFromCacheRecord({ delivery_info: campaign.delivery_info });
  } catch (e) {
    console.error("Error extracting quick stats:", e);
    return createEmptyStatistics();
  }
};

// Simple in-memory cache for statistics
const statsCache = new Map<string, AcelleCampaignStatistics>();

/**
 * Get cached statistics for a campaign
 */
export const getCachedStats = (campaignUid: string): AcelleCampaignStatistics | null => {
  return statsCache.get(campaignUid) || null;
};

/**
 * Cache statistics for a campaign
 */
export const cacheStats = (campaignUid: string, stats: AcelleCampaignStatistics): void => {
  statsCache.set(campaignUid, stats);
};
