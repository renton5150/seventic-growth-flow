
import { supabase } from "@/integrations/supabase/client";
import { AcelleCampaignStatistics, AcelleAccount } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";

/**
 * Vérifie si les statistiques sont en cache et les récupère si elles sont fraîches
 */
export async function getCachedStatistics(
  campaignUid: string
): Promise<AcelleCampaignStatistics | null> {
  console.log(`[Stats] Vérification du cache pour campagne ${campaignUid}...`);
  
  // Essayer d'abord campaign_stats_cache (table spécifique aux statistiques)
  const { data: cachedStatsData, error: cacheStatsError } = await supabase
    .from('campaign_stats_cache')
    .select('statistics, last_updated')
    .eq('campaign_uid', campaignUid)
    .single();
  
  console.log(`[Stats] Résultat cache stats:`, 
    cachedStatsData ? "Données trouvées" : "Cache stats vide", 
    cacheStatsError ? `Erreur: ${cacheStatsError.message}` : "Pas d'erreur");
  
  if (!cacheStatsError && cachedStatsData && cachedStatsData.statistics) {
    // Vérifier la fraîcheur du cache
    const lastUpdated = new Date(cachedStatsData.last_updated);
    const now = new Date();
    const cacheAgeHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    if (cacheAgeHours < 24) {
      console.log(`[Stats] Utilisation du cache stats pour ${campaignUid}, âge: ${cacheAgeHours.toFixed(2)}h`);
      
      // Extraire les statistiques du cache (gérer string ou objet)
      let statistics: AcelleCampaignStatistics;
      
      if (typeof cachedStatsData.statistics === 'string') {
        try {
          const parsedData = JSON.parse(cachedStatsData.statistics);
          // Vérifier que les données analysées sont bien un objet avec les propriétés attendues
          if (typeof parsedData === 'object' && parsedData !== null && !Array.isArray(parsedData)) {
            // Convertir explicitement en utilisant la fonction de validation/complétion
            statistics = ensureValidStatistics(parsedData);
          } else {
            console.error(`[Stats] Format de données JSON invalide:`, parsedData);
            return null;
          }
        } catch (e) {
          console.error(`[Stats] Erreur parsing JSON du cache:`, e);
          return null;
        }
      } else if (typeof cachedStatsData.statistics === 'object' && cachedStatsData.statistics !== null) {
        // Assurer que c'est un objet (pas un tableau)
        if (!Array.isArray(cachedStatsData.statistics)) {
          // Convertir explicitement en utilisant la fonction de validation/complétion
          statistics = ensureValidStatistics(cachedStatsData.statistics);
        } else {
          console.error(`[Stats] Format de données invalide (tableau):`, cachedStatsData.statistics);
          return null;
        }
      } else {
        console.error(`[Stats] Format de données invalide:`, cachedStatsData.statistics);
        return null;
      }
      
      return statistics;
    } else {
      console.log(`[Stats] Cache expiré pour ${campaignUid}, âge: ${cacheAgeHours.toFixed(2)}h > 24h`);
    }
  }
  
  return null;
}

/**
 * Récupère les informations de livraison depuis le cache
 */
export async function getCachedDeliveryInfo(
  campaignUid: string
): Promise<any | null> {
  console.log(`[Stats] Vérification du cache email_campaigns_cache pour ${campaignUid}...`);
  
  const { data: cachedCampaign, error: cacheCampaignError } = await supabase
    .from('email_campaigns_cache')
    .select('delivery_info, cache_updated_at')
    .eq('campaign_uid', campaignUid)
    .single();
  
  console.log(`[Stats] Résultat cache campaigns:`, 
    cachedCampaign ? "Données trouvées" : "Cache campaigns vide", 
    cacheCampaignError ? `Erreur: ${cacheCampaignError.message}` : "Pas d'erreur");
  
  if (!cacheCampaignError && cachedCampaign && cachedCampaign.delivery_info) {
    // Vérifier la fraîcheur du cache
    const lastUpdated = new Date(cachedCampaign.cache_updated_at || new Date());
    const now = new Date();
    const cacheAgeHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    if (cacheAgeHours < 24) {
      console.log(`[Stats] Utilisation du cache campaigns pour ${campaignUid}, âge: ${cacheAgeHours.toFixed(2)}h`);
      
      try {
        // Parse delivery_info if it's a string, otherwise use as is if it's an object
        const delivery_info = typeof cachedCampaign.delivery_info === 'string'
          ? JSON.parse(cachedCampaign.delivery_info)
          : cachedCampaign.delivery_info || {};
        
        // Ensure delivery_info is an object and has the required properties
        if (typeof delivery_info === 'object' && delivery_info !== null) {
          return delivery_info;
        }
      } catch (parseError) {
        console.error(`[Stats] Erreur lors de l'analyse des stats en cache:`, parseError);
      }
    } else {
      console.log(`[Stats] Cache campaigns expiré pour ${campaignUid}, âge: ${cacheAgeHours.toFixed(2)}h > 24h`);
    }
  }
  
  return null;
}

/**
 * Mise à jour du cache de statistiques
 */
export async function updateStatisticsCache(
  campaignUid: string,
  accountId: string,
  statistics: AcelleCampaignStatistics
): Promise<void> {
  try {
    console.log(`[Stats] Mise à jour du cache campaign_stats_cache pour ${campaignUid}`);
    
    // Fix: Convert statistics object to a standard JSON object to match the Json type expected by Supabase
    // This creates a plain object that can be safely stored as Json
    const statisticsJson = JSON.parse(JSON.stringify(statistics));
    
    const { error: statsUpsertError } = await supabase
      .from('campaign_stats_cache')
      .upsert({
        campaign_uid: campaignUid,
        account_id: accountId,
        statistics: statisticsJson,  // Using the JSON-compatible version
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'campaign_uid,account_id'
      });
    
    if (statsUpsertError) {
      console.error(`[Stats] Erreur lors de la mise à jour de campaign_stats_cache:`, statsUpsertError);
    } else {
      console.log(`[Stats] Mise à jour de campaign_stats_cache réussie pour ${campaignUid}`);
    }
  } catch (cacheStatsError) {
    console.error(`[Stats] Exception lors de la mise à jour de campaign_stats_cache:`, cacheStatsError);
  }
}

/**
 * Mise à jour du cache de campagne
 */
export async function updateCampaignCache(
  campaignUid: string,
  accountId: string,
  delivery_info: any
): Promise<void> {
  try {
    console.log(`[Stats] Mise à jour du cache email_campaigns_cache pour ${campaignUid}`);
    
    const { error: campaignUpsertError } = await supabase
      .from('email_campaigns_cache')
      .update({
        delivery_info: delivery_info,
        cache_updated_at: new Date().toISOString()
      })
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId);
    
    if (campaignUpsertError) {
      console.error(`[Stats] Erreur lors de la mise à jour de email_campaigns_cache:`, campaignUpsertError);
    } else {
      console.log(`[Stats] Mise à jour de email_campaigns_cache réussie pour ${campaignUid}`);
    }
  } catch (cacheCampaignError) {
    console.error(`[Stats] Exception lors de la mise à jour de email_campaigns_cache:`, cacheCampaignError);
  }
}

/**
 * Teste l'insertion d'une statistique dans le cache pour vérification
 */
export const testCacheInsertion = async (
  account: AcelleAccount
): Promise<boolean> => {
  try {
    console.log(`[Stats] Test d'insertion dans le cache pour compte ${account.name}`);
    
    // Create a test statistics object
    const testStats: AcelleCampaignStatistics = {
      subscriber_count: 100,
      delivered_count: 80,
      delivered_rate: 0.8,
      open_count: 40,
      uniq_open_count: 35,
      uniq_open_rate: 0.35,
      click_count: 20,
      click_rate: 0.2,
      bounce_count: 5,
      soft_bounce_count: 3,
      hard_bounce_count: 2,
      unsubscribe_count: 2,
      abuse_complaint_count: 0
    };
    
    // Convert to a standard JSON object to satisfy the Json type requirement
    const statisticsJson = JSON.parse(JSON.stringify(testStats));
    
    const testData = {
      campaign_uid: "test-campaign-uid",
      account_id: account.id,
      statistics: statisticsJson,  // Using the JSON-compatible version
      last_updated: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from('campaign_stats_cache')
      .upsert(testData);
    
    if (insertError) {
      console.error(`[Stats] Erreur lors du test d'insertion:`, insertError);
      return false;
    }
    
    console.log(`[Stats] Test d'insertion réussi`);
    return true;
  } catch (error) {
    console.error(`[Stats] Exception lors du test d'insertion:`, error);
    return false;
  }
};
