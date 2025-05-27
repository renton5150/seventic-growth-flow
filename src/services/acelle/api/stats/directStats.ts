import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";
import { saveCampaignStatistics } from "./cacheManager";
import { supabase } from "@/integrations/supabase/client";
import { getAdaptiveTimeout, ERROR_HANDLING } from "@/utils/acelle/config";

/**
 * Vérifie si les statistiques sont vides ou non initialisées
 */
export const hasEmptyStatistics = (statistics?: AcelleCampaignStatistics | null): boolean => {
  if (!statistics) return true;
  
  const hasNonZeroValue = 
    statistics.subscriber_count > 0 || 
    statistics.delivered_count > 0 ||
    statistics.open_count > 0 ||
    statistics.click_count > 0 ||
    statistics.bounce_count > 0;
  
  return !hasNonZeroValue;
};

/**
 * Implémente un délai avec backoff exponentiel
 */
const delayWithBackoff = (attempt: number): Promise<void> => {
  if (!ERROR_HANDLING.EXPONENTIAL_BACKOFF) {
    return new Promise(resolve => setTimeout(resolve, ERROR_HANDLING.RETRY_DELAY_MS));
  }
  
  const delay = Math.min(
    ERROR_HANDLING.RETRY_DELAY_MS * Math.pow(2, attempt),
    ERROR_HANDLING.MAX_RETRY_DELAY_MS
  );
  
  console.log(`[directStats] Attente de ${delay}ms avant nouvelle tentative (attempt ${attempt + 1})`);
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Récupère les statistiques via Edge Functions avec timeouts adaptatifs ultra-robustes
 */
export const fetchDirectStatistics = async (
  campaignUid: string,
  account: AcelleAccount,
  options?: {
    customTimeout?: number;
    skipCache?: boolean;
    retryAttempt?: number;
  }
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`[fetchDirectStatistics] 🚀 Récupération ROBUSTE pour ${campaignUid} via ${account.name}`);
    
    if (!campaignUid || !account?.id) {
      console.error("[fetchDirectStatistics] ❌ Paramètres manquants");
      return null;
    }
    
    // Calculer le timeout adaptatif avec escalade pour les tentatives multiples
    const baseTimeout = options?.customTimeout || getAdaptiveTimeout(account.name);
    const retryAttempt = options?.retryAttempt || 0;
    const adaptiveTimeout = retryAttempt > 0 ? Math.min(baseTimeout * (1 + retryAttempt * 0.5), 180000) : baseTimeout;
    
    console.log(`[fetchDirectStatistics] ⏱️ Timeout adaptatif: ${adaptiveTimeout}ms pour ${account.name} (tentative ${retryAttempt + 1})`);
    
    // Méthode 1: Via acelle-proxy avec timeout adaptatif ultra-robuste
    for (let attempt = 0; attempt < ERROR_HANDLING.MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[fetchDirectStatistics] 🔄 Proxy tentative ${attempt + 1}/${ERROR_HANDLING.MAX_RETRIES} pour ${campaignUid}`);
          await delayWithBackoff(attempt - 1);
        } else {
          console.log(`[fetchDirectStatistics] 📡 Proxy première tentative pour ${campaignUid}`);
        }
        
        const startTime = Date.now();
        
        const { data, error } = await supabase.functions.invoke('acelle-proxy', {
          body: { 
            endpoint: account.api_endpoint,
            api_token: account.api_token,
            action: 'get_campaign_stats',
            campaign_uid: campaignUid,
            timeout: adaptiveTimeout,
            retry_attempt: attempt,
            account_name: account.name
          }
        });
        
        const duration = Date.now() - startTime;
        console.log(`[fetchDirectStatistics] ⏱️ Durée acelle-proxy: ${duration}ms (tentative ${attempt + 1})`);
        
        if (!error && data?.success && data.statistics) {
          console.log(`[fetchDirectStatistics] ✅ SUCCÈS proxy pour ${campaignUid} en ${duration}ms (tentative ${attempt + 1})`);
          const validStats = ensureValidStatistics(data.statistics as Partial<AcelleCampaignStatistics>);
          
          // Sauvegarder en cache (sans bloquer)
          if (!options?.skipCache) {
            saveCampaignStatistics(campaignUid, account.id, validStats).catch(err => {
              console.warn("[fetchDirectStatistics] ⚠️ Erreur cache:", err);
            });
          }
          
          return validStats;
        }
        
        if (error) {
          console.warn(`[fetchDirectStatistics] ⚠️ Erreur proxy (tentative ${attempt + 1}):`, error);
          
          // Analyser le type d'erreur pour décider si continuer
          const errorMsg = error.message?.toLowerCase() || '';
          if (errorMsg.includes('unauthorized') || errorMsg.includes('invalid token') || errorMsg.includes('forbidden')) {
            console.error(`[fetchDirectStatistics] ❌ Erreur d'authentification, arrêt des tentatives`);
            break;
          }
          
          // Pour les timeouts, augmenter le délai
          if (errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
            console.warn(`[fetchDirectStatistics] ⏰ Timeout détecté, escalade du timeout pour tentative suivante`);
            // La prochaine tentative utilisera un timeout plus long
          }
        }
      } catch (proxyError: any) {
        console.warn(`[fetchDirectStatistics] ⚠️ Exception proxy (tentative ${attempt + 1}):`, proxyError?.message || proxyError);
        
        // Si c'est un timeout, on peut être plus agressif sur les délais
        if (proxyError?.name === 'AbortError' || proxyError?.message?.includes('aborted')) {
          console.warn(`[fetchDirectStatistics] ⏰ Timeout AbortError détecté`);
        }
      }
    }
    
    // Méthode 2: Via acelle-stats-test avec timeout encore plus long
    const fallbackTimeout = Math.min(adaptiveTimeout * 1.2, 200000); // Encore plus de temps pour le fallback
    
    for (let attempt = 0; attempt < ERROR_HANDLING.MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[fetchDirectStatistics] 🔄 Fallback tentative ${attempt + 1}/${ERROR_HANDLING.MAX_RETRIES} pour ${campaignUid}`);
          await delayWithBackoff(attempt - 1);
        } else {
          console.log(`[fetchDirectStatistics] 📡 Fallback acelle-stats-test pour ${campaignUid}`);
        }
        
        const startTime = Date.now();
        
        const { data, error } = await supabase.functions.invoke('acelle-stats-test', {
          body: { 
            campaignId: campaignUid, 
            accountId: account.id, 
            forceRefresh: 'true',
            timeout: fallbackTimeout,
            retry_attempt: attempt,
            account_name: account.name
          }
        });
        
        const duration = Date.now() - startTime;
        console.log(`[fetchDirectStatistics] ⏱️ Durée fallback: ${duration}ms (tentative ${attempt + 1})`);
        
        if (!error && data?.success && data.stats) {
          console.log(`[fetchDirectStatistics] ✅ SUCCÈS fallback pour ${campaignUid} en ${duration}ms (tentative ${attempt + 1})`);
          const validStats = ensureValidStatistics(data.stats as Partial<AcelleCampaignStatistics>);
          
          // Sauvegarder en cache (sans bloquer)
          if (!options?.skipCache) {
            saveCampaignStatistics(campaignUid, account.id, validStats).catch(err => {
              console.warn("[fetchDirectStatistics] ⚠️ Erreur cache:", err);
            });
          }
          
          return validStats;
        }
        
        if (error) {
          console.warn(`[fetchDirectStatistics] ⚠️ Erreur fallback (tentative ${attempt + 1}):`, error);
        }
      } catch (edgeError: any) {
        console.warn(`[fetchDirectStatistics] ⚠️ Exception fallback (tentative ${attempt + 1}):`, edgeError?.message || edgeError);
      }
    }
    
    // Méthode 3: Fallback sur le cache local uniquement (si pas désactivé)
    if (!options?.skipCache) {
      try {
        console.log(`[fetchDirectStatistics] 💾 Fallback cache pour ${campaignUid}`);
        
        const { data: cachedStats } = await supabase
          .from('campaign_stats_cache')
          .select('statistics')
          .eq('campaign_uid', campaignUid)
          .eq('account_id', account.id)
          .maybeSingle();
        
        if (cachedStats?.statistics && typeof cachedStats.statistics === 'object') {
          console.log(`[fetchDirectStatistics] ✅ Statistiques trouvées en cache pour ${campaignUid}`);
          return ensureValidStatistics(cachedStats.statistics as Partial<AcelleCampaignStatistics>);
        }
      } catch (cacheError) {
        console.warn(`[fetchDirectStatistics] ⚠️ Erreur cache:`, cacheError);
      }
    }
    
    console.error(`[fetchDirectStatistics] ❌ TOUTES les méthodes ont échoué pour ${campaignUid} après ${ERROR_HANDLING.MAX_RETRIES} tentatives avec timeouts adaptatifs`);
    return null;
  } catch (error: any) {
    console.error(`[fetchDirectStatistics] ❌ Erreur générale:`, error?.message || error);
    return null;
  }
};

/**
 * Enrichit les campagnes avec des statistiques - Version ultra-robuste avec timeouts adaptatifs
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options?: {
    forceRefresh?: boolean;
    customTimeout?: number;
    onProgress?: (current: number, total: number, campaignName: string) => void;
  }
): Promise<AcelleCampaign[]> => {
  if (!campaigns.length || !account) return campaigns;
  
  const adaptiveTimeout = options?.customTimeout || getAdaptiveTimeout(account.name);
  console.log(`[enrichCampaignsWithStats] 🚀 Enrichissement de ${campaigns.length} campagnes pour ${account.name} (timeout: ${adaptiveTimeout}ms)`);
  
  const enrichedCampaigns: AcelleCampaign[] = [];
  
  // Traiter les campagnes une par une pour éviter la surcharge avec délai adaptatif
  for (let i = 0; i < campaigns.length; i++) {
    const campaign = campaigns[i];
    
    try {
      // Signaler le progrès si callback fourni
      if (options?.onProgress) {
        options.onProgress(i + 1, campaigns.length, campaign.name || 'Campagne sans nom');
      }
      
      const campaignUid = campaign.uid || campaign.campaign_uid || '';
      if (!campaignUid) {
        console.warn("[enrichCampaignsWithStats] ⚠️ Campaign sans UID:", campaign);
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      // Vérifier si les statistiques sont vides dans delivery_info
      const hasEmptyDeliveryInfo = !campaign.delivery_info || 
        Object.keys(campaign.delivery_info).length === 0 ||
        (!campaign.delivery_info.subscriber_count && !campaign.delivery_info.delivered_count);
      
      // Forcer la récupération si les statistiques semblent vides ou si demandé
      const shouldFetchStats = options?.forceRefresh || 
        hasEmptyStatistics(campaign.statistics) || 
        hasEmptyDeliveryInfo;
      
      if (shouldFetchStats) {
        console.log(`[enrichCampaignsWithStats] 📊 Récupération stats pour ${campaign.name} (${campaignUid}) - ${i + 1}/${campaigns.length}`);
        
        // Récupérer les statistiques via Edge Functions avec timeout adaptatif
        const statistics = await fetchDirectStatistics(campaignUid, account, {
          customTimeout: adaptiveTimeout
        });
        
        // Créer la campagne enrichie
        const enrichedCampaign = {
          ...campaign,
          statistics: statistics || campaign.statistics || createEmptyStatistics(),
          meta: {
            ...campaign.meta,
            data_source: statistics ? 'edge_function' : 'cache',
            last_refresh: new Date().toISOString(),
            has_stats: !!statistics,
            timeout_used: adaptiveTimeout
          }
        };
        
        enrichedCampaigns.push(enrichedCampaign);
        
        // Pause entre chaque campagne pour éviter la surcharge des APIs - délai adaptatif
        if (i < campaigns.length - 1) {
          const pauseDelay = account.name === 'Dfin' ? 500 : 200; // Pause plus longue pour DFIN
          await new Promise(resolve => setTimeout(resolve, pauseDelay));
        }
      } else {
        console.log(`[enrichCampaignsWithStats] ✅ Statistiques déjà disponibles pour ${campaign.name}`);
        enrichedCampaigns.push(campaign);
      }
      
    } catch (error) {
      console.error(`[enrichCampaignsWithStats] ❌ Erreur pour campagne ${campaign.uid}:`, error);
      enrichedCampaigns.push({
        ...campaign,
        statistics: campaign.statistics || createEmptyStatistics()
      });
    }
  }
  
  console.log(`[enrichCampaignsWithStats] ✅ Enrichissement terminé: ${enrichedCampaigns.length}/${campaigns.length} campagnes pour ${account.name}`);
  return enrichedCampaigns;
};
