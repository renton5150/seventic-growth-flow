
import { supabase } from "@/integrations/supabase/client";
import { AcelleCampaignStatistics } from "@/types/acelle.types";
import { toast } from "sonner";

// Définir une constante pour la durée de fraîcheur des données (24 heures en millisecondes)
const CACHE_FRESHNESS_DURATION = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Vérifie si les données en cache sont considérées comme "fraîches" (moins de 24h)
 */
export const isCacheFresh = (lastUpdated: string | null): boolean => {
  if (!lastUpdated) return false;
  
  try {
    const lastUpdatedDate = new Date(lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdatedDate.getTime();
    
    return diffMs < CACHE_FRESHNESS_DURATION;
  } catch (error) {
    console.error("Erreur lors de la vérification de la fraîcheur du cache:", error);
    return false;
  }
};

/**
 * Récupère les statistiques en cache pour une campagne spécifique
 */
export const getCachedStats = async (
  campaignUid: string, 
  accountId: string
): Promise<{ statistics: AcelleCampaignStatistics | null; lastUpdated: string | null; isFresh: boolean }> => {
  try {
    const { data, error } = await supabase
      .from("campaign_stats_cache")
      .select("statistics, last_updated")
      .eq("campaign_uid", campaignUid)
      .eq("account_id", accountId)
      .single();
    
    if (error || !data) {
      console.log(`Pas de données en cache pour la campagne ${campaignUid}`);
      return { statistics: null, lastUpdated: null, isFresh: false };
    }
    
    const cacheFresh = isCacheFresh(data.last_updated);
    console.log(`Données en cache pour la campagne ${campaignUid} (fraîches: ${cacheFresh})`);
    
    return { 
      statistics: data.statistics as AcelleCampaignStatistics,
      lastUpdated: data.last_updated,
      isFresh: cacheFresh
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques en cache:", error);
    return { statistics: null, lastUpdated: null, isFresh: false };
  }
};

/**
 * Met à jour les statistiques en cache pour une campagne
 */
export const updateCachedStats = async (
  campaignUid: string,
  accountId: string,
  statistics: AcelleCampaignStatistics
): Promise<boolean> => {
  try {
    // Vérifier si les statistiques contiennent des données réelles
    if (!statistics || !hasValidStatistics(statistics)) {
      console.log(`Statistiques non valides pour la campagne ${campaignUid}, mise en cache ignorée`);
      return false;
    }
    
    const { error } = await supabase
      .from("campaign_stats_cache")
      .upsert({
        campaign_uid: campaignUid,
        account_id: accountId,
        statistics: statistics as any, // Cast pour éviter les problèmes de type avec JSONB
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'campaign_uid,account_id'
      });
    
    if (error) {
      console.error("Erreur lors de la mise à jour du cache:", error);
      return false;
    }
    
    console.log(`Cache mis à jour pour la campagne ${campaignUid}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du cache:", error);
    return false;
  }
};

/**
 * Récupère des statistiques en cache pour plusieurs campagnes
 */
export const getBulkCachedStats = async (
  campaignUids: string[],
  accountId: string
): Promise<Record<string, { statistics: AcelleCampaignStatistics; lastUpdated: string; isFresh: boolean }>> => {
  if (!campaignUids.length) return {};
  
  try {
    const { data, error } = await supabase
      .from("campaign_stats_cache")
      .select("campaign_uid, statistics, last_updated")
      .eq("account_id", accountId)
      .in("campaign_uid", campaignUids);
    
    if (error || !data) {
      console.error("Erreur lors de la récupération en masse des statistiques:", error);
      return {};
    }
    
    const result: Record<string, { statistics: AcelleCampaignStatistics; lastUpdated: string; isFresh: boolean }> = {};
    
    // Construire un objet avec les UID de campagne comme clés
    data.forEach(item => {
      if (item.campaign_uid && item.statistics) {
        const cacheFresh = isCacheFresh(item.last_updated);
        result[item.campaign_uid] = {
          statistics: item.statistics as AcelleCampaignStatistics,
          lastUpdated: item.last_updated,
          isFresh: cacheFresh
        };
      }
    });
    
    console.log(`Récupéré ${Object.keys(result).length} statistiques en cache sur ${campaignUids.length} demandées`);
    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération en masse des statistiques:", error);
    return {};
  }
};

/**
 * Supprime les statistiques en cache pour une campagne
 */
export const clearCachedStats = async (
  campaignUid: string,
  accountId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("campaign_stats_cache")
      .delete()
      .eq("campaign_uid", campaignUid)
      .eq("account_id", accountId);
    
    if (error) {
      console.error("Erreur lors de la suppression du cache:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression du cache:", error);
    return false;
  }
};

/**
 * Vérifie si les statistiques contiennent des données valides
 */
export const hasValidStatistics = (stats: AcelleCampaignStatistics | undefined | null): boolean => {
  if (!stats) return false;
  
  // Vérifier que les statistiques essentielles existent et ne sont pas toutes à zéro
  const hasNonZeroValues = 
    (typeof stats.subscriber_count === 'number' && stats.subscriber_count > 0) || 
    (typeof stats.delivered_count === 'number' && stats.delivered_count > 0) || 
    (typeof stats.open_count === 'number' && stats.open_count > 0);
    
  return hasNonZeroValues;
};
