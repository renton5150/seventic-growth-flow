
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { fetchCampaignStatisticsFromApi } from "./apiClient";
import { getCachedStatistics, getLastUpdatedTimestamp, saveCampaignStatistics, isCacheValid } from "./cacheManager";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

// Constante pour définir la durée de validité du cache (5 minutes par défaut)
const CACHE_VALIDITY_DURATION_MS = 5 * 60 * 1000; // 5 minutes en millisecondes

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
  
  // Logging amélioré
  console.log(`[directStats] Enrichissement de ${campaigns.length} campagnes avec des statistiques...`);
  console.log(`[directStats] Options: forceRefresh=${forceRefresh}, cacheMaxAgeMs=${cacheMaxAgeMs}ms`);
  
  for (const campaign of campaigns) {
    try {
      const campaignUid = campaign.uid || campaign.campaign_uid || '';
      if (!campaignUid) {
        console.warn("[directStats] Campagne sans UID détectée, impossible d'enrichir avec des statistiques");
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      console.log(`[directStats] Traitement de la campagne ${campaignUid} (${campaign.name})`);
      
      let statistics: AcelleCampaignStatistics | null = null;
      
      // 1. Essayer d'abord de récupérer depuis le cache si on ne force pas le rafraîchissement
      if (!forceRefresh) {
        statistics = await getCachedStatistics(campaignUid, account.id);
        
        // Vérifier la fraîcheur du cache si nous avons des statistiques
        if (statistics && statistics.subscriber_count > 0) {
          const lastUpdated = await getLastUpdatedTimestamp(campaignUid, account.id);
          const isCacheFresh = isCacheValid(lastUpdated, cacheMaxAgeMs);
          
          if (isCacheFresh) {
            console.log(`[directStats] Statistiques en cache valides et récentes pour ${campaignUid}, utilisation du cache`);
            // Si le cache est valide et récent, on l'utilise
            enrichedCampaigns.push({
              ...campaign,
              statistics: ensureValidStatistics(statistics)
            });
            continue;
          } else {
            console.log(`[directStats] Statistiques en cache pour ${campaignUid} mais trop anciennes, rafraîchissement`);
          }
        } else {
          console.log(`[directStats] Aucune statistique en cache pour ${campaignUid} ou données invalides`);
        }
      } else {
        console.log(`[directStats] Forçage du rafraîchissement pour ${campaignUid}`);
      }
      
      // 2. Récupérer depuis l'API si le cache est invalide, trop ancien, forceRefresh=true ou les statistiques ne sont pas complètes
      console.log(`[directStats] Récupération des statistiques depuis l'API pour ${campaignUid}`);
      statistics = await fetchCampaignStatisticsFromApi(campaignUid, account);
      
      if (statistics) {
        // Toujours sauvegarder en cache les nouvelles statistiques
        console.log(`[directStats] Sauvegarde des nouvelles statistiques en cache pour ${campaignUid}`);
        await saveCampaignStatistics(campaignUid, account.id, statistics);
        
        // Ajouter les statistiques à la campagne
        enrichedCampaigns.push({
          ...campaign,
          statistics: ensureValidStatistics(statistics)
        });
      } else {
        console.warn(`[directStats] Pas de statistiques API pour ${campaignUid}, utilisation des statistiques existantes`);
        // Utiliser les statistiques existantes de la campagne si disponibles, sinon créer des statistiques vides
        const fallbackStats = campaign.statistics || createEmptyStatistics();
        enrichedCampaigns.push({
          ...campaign,
          statistics: ensureValidStatistics(fallbackStats)
        });
      }
    } catch (error) {
      console.error(`[directStats] Error enriching campaign ${campaign.uid || campaign.name} with stats:`, error);
      // Still include the campaign without statistics or with existing statistics
      enrichedCampaigns.push(campaign);
    }
  }
  
  return enrichedCampaigns;
};

// Fonction optimisée pour récupérer les statistiques d'une seule campagne
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
    
    console.log(`[DirectStats] Récupération des statistiques pour ${campaignUid}, forceRefresh=${forceRefresh}`);
    
    // Try to get from cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedStats = await getCachedStatistics(campaignUid, account.id);
      
      if (cachedStats && cachedStats.subscriber_count > 0) {
        const lastUpdated = await getLastUpdatedTimestamp(campaignUid, account.id);
        const isCacheFresh = isCacheValid(lastUpdated, cacheMaxAgeMs);
        
        if (isCacheFresh) {
          console.log(`[DirectStats] Utilisation du cache pour ${campaignUid}, données récentes`);
          return ensureValidStatistics(cachedStats);
        } else {
          console.log(`[DirectStats] Cache expiré pour ${campaignUid}, rafraîchissement nécessaire`);
        }
      } else {
        console.log(`[DirectStats] Pas de cache pour ${campaignUid} ou données invalides`);
      }
    } else {
      console.log(`[DirectStats] Rechargement forcé des statistiques pour ${campaignUid}`);
    }
    
    // If we're here, either cache is invalid or we're forcing refresh
    console.log(`[DirectStats] Appel à l'API pour ${campaignUid}`);
    const apiStats = await fetchCampaignStatisticsFromApi(campaignUid, account);
    
    if (apiStats) {
      // Save to cache for future use
      console.log(`[DirectStats] Sauvegarde en cache pour ${campaignUid}`);
      await saveCampaignStatistics(campaignUid, account.id, apiStats);
      return ensureValidStatistics(apiStats);
    } else {
      console.log(`[DirectStats] Pas de résultat API pour ${campaignUid}`);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching direct statistics for campaign ${campaignUid}:`, error);
    return null;
  }
};
