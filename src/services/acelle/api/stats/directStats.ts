
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { fetchCampaignStatisticsFromApi } from "./apiClient";
import { getCachedStatistics, saveCampaignStatistics } from "./cacheManager";

// Constante pour définir la durée de validité du cache (5 minutes par défaut)
const CACHE_VALIDITY_DURATION_MS = 5 * 60 * 1000; // 5 minutes en millisecondes

/**
 * Vérifie si les statistiques en cache sont récentes
 */
const isCacheValid = (lastUpdated: string | null, maxAgeMs: number = CACHE_VALIDITY_DURATION_MS): boolean => {
  if (!lastUpdated) return false;
  
  try {
    const lastUpdatedDate = new Date(lastUpdated);
    const now = new Date();
    const ageMs = now.getTime() - lastUpdatedDate.getTime();
    
    return ageMs < maxAgeMs;
  } catch (error) {
    console.error("Erreur lors de la vérification de validité du cache:", error);
    return false;
  }
};

/**
 * Enrichit les campagnes avec des statistiques en utilisant l'API directe ou le cache
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options?: {
    forceRefresh?: boolean;
    cacheMaxAgeMs?: number;
  }
): Promise<AcelleCampaign[]> => {
  if (!campaigns.length) return campaigns;
  
  const forceRefresh = options?.forceRefresh || false;
  const cacheMaxAgeMs = options?.cacheMaxAgeMs || CACHE_VALIDITY_DURATION_MS;
  const enrichedCampaigns: AcelleCampaign[] = [];
  
  // Vérifier d'abord si nous avons des statistiques valides dans la campagne
  // Si toutes les campagnes ont déjà des statistiques, nous pouvons renvoyer immédiatement
  const allHaveValidStats = campaigns.every(campaign => {
    return campaign.statistics && 
           campaign.statistics.subscriber_count > 0 &&
           campaign.statistics.delivered_count >= 0;
  });
  
  if (allHaveValidStats && !forceRefresh) {
    console.log("Toutes les campagnes ont déjà des statistiques valides, pas d'enrichissement nécessaire");
    return campaigns;
  }
  
  console.log(`Enrichissement de ${campaigns.length} campagnes avec des statistiques...`);
  console.log(`Options: forceRefresh=${forceRefresh}, cacheMaxAgeMs=${cacheMaxAgeMs}ms`);
  
  for (const campaign of campaigns) {
    try {
      const campaignUid = campaign.uid || campaign.campaign_uid || '';
      if (!campaignUid) {
        console.warn("Campagne sans UID détectée, impossible d'enrichir avec des statistiques");
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      // Vérifier si la campagne a déjà des statistiques valides
      if (
        !forceRefresh && 
        campaign.statistics && 
        campaign.statistics.subscriber_count > 0
      ) {
        console.log(`Campagne ${campaignUid} a déjà des statistiques valides, pas d'enrichissement nécessaire`);
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      let statistics: AcelleCampaignStatistics | null = null;
      
      if (!forceRefresh) {
        // Try to get from cache first if not forcing refresh
        statistics = await getCachedStatistics(campaignUid, account.id);
        
        // Vérifier la fraîcheur du cache si nous avons des statistiques
        if (statistics && statistics.subscriber_count > 0) {
          const { data } = await supabase
            .from('campaign_stats_cache')
            .select('last_updated')
            .eq('campaign_uid', campaignUid)
            .eq('account_id', account.id)
            .single();
            
          const isCacheFresh = isCacheValid(data?.last_updated, cacheMaxAgeMs);
          
          if (isCacheFresh) {
            console.log(`Statistiques en cache valides et récentes pour ${campaignUid}, utilisation du cache`);
            // Si le cache est valide et récent, on l'utilise
            enrichedCampaigns.push({
              ...campaign,
              statistics: ensureValidStatistics(statistics)
            });
            continue;
          } else {
            console.log(`Statistiques en cache pour ${campaignUid} mais trop anciennes, rafraîchissement`);
          }
        } else {
          console.log(`Aucune statistique en cache pour ${campaignUid}`);
        }
      }
      
      // Si nous sommes ici, c'est que nous devons récupérer les statistiques depuis l'API
      console.log(`Récupération des statistiques depuis l'API pour ${campaignUid}`);
      statistics = await fetchCampaignStatisticsFromApi(campaignUid, account);
      
      if (statistics) {
        // Save to cache for future use
        console.log(`Sauvegarde des nouvelles statistiques en cache pour ${campaignUid}`);
        await saveCampaignStatistics(campaignUid, account.id, statistics);
      } else {
        console.warn(`Pas de statistiques API pour ${campaignUid}`);
      }
      
      // Add statistics to campaign
      enrichedCampaigns.push({
        ...campaign,
        statistics: statistics ? ensureValidStatistics(statistics) : null
      });
    } catch (error) {
      console.error(`Error enriching campaign ${campaign.uid} with stats:`, error);
      // Still include the campaign without statistics
      enrichedCampaigns.push(campaign);
    }
  }
  
  return enrichedCampaigns;
};

// Other exports for compatibility with other modules
export const fetchDirectStatistics = async (
  campaignUid: string,
  account: AcelleAccount,
  options?: {
    forceRefresh?: boolean;
    cacheMaxAgeMs?: number;
  }
): Promise<AcelleCampaignStatistics | null> => {
  try {
    const forceRefresh = options?.forceRefresh || false;
    const cacheMaxAgeMs = options?.cacheMaxAgeMs || CACHE_VALIDITY_DURATION_MS;
    
    // Try to get from cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedStats = await getCachedStatistics(campaignUid, account.id);
      
      if (cachedStats && cachedStats.subscriber_count > 0) {
        const { data } = await supabase
          .from('campaign_stats_cache')
          .select('last_updated')
          .eq('campaign_uid', campaignUid)
          .eq('account_id', account.id)
          .single();
          
        const isCacheFresh = isCacheValid(data?.last_updated, cacheMaxAgeMs);
        
        if (isCacheFresh) {
          console.log(`Statistiques en cache valides et récentes pour ${campaignUid}, utilisation du cache`);
          return ensureValidStatistics(cachedStats);
        }
      }
    }
    
    // If we're here, either cache is invalid or we're forcing refresh
    const apiStats = await fetchCampaignStatisticsFromApi(campaignUid, account);
    
    if (apiStats) {
      // Save to cache for future use
      await saveCampaignStatistics(campaignUid, account.id, apiStats);
      return ensureValidStatistics(apiStats);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching direct statistics for campaign ${campaignUid}:`, error);
    return null;
  }
};

// Importer supabase pour les opérations de cache
import { supabase } from "@/integrations/supabase/client";
