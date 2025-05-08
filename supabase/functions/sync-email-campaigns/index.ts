
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Amélioré avec des entêtes CORS complets selon les recommandations
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Pour le développement - en production, limitez aux domaines spécifiques
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-api-key, accept, origin',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 heures de cache pour les préflights
  'Vary': 'Origin' // Important pour les CDNs et caches intermédiaires
};

const supabaseUrl = 'https://dupguifqyjchlmzbadav.supabase.co';
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds default timeout
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

// Configuration des niveaux de log
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
  VERBOSE: 5
};

// Niveau de log par défaut
let currentLogLevel = LOG_LEVELS.INFO;

// Service activity tracking
let lastActivity = Date.now();

// Logger amélioré avec niveaux de log et formatage JSON
function debugLog(message: string, data?: any, level: number = LOG_LEVELS.INFO) {
  // Skip logging if current log level is lower than requested
  if (level > currentLogLevel) return;
  
  const timestamp = new Date().toISOString();
  let levelName = "INFO";
  let logMethod = console.log;
  
  switch(level) {
    case LOG_LEVELS.ERROR:
      levelName = "ERROR";
      logMethod = console.error;
      break;
    case LOG_LEVELS.WARN:
      levelName = "WARN";
      logMethod = console.warn;
      break;
    case LOG_LEVELS.INFO:
      levelName = "INFO";
      logMethod = console.log;
      break;
    case LOG_LEVELS.DEBUG:
      levelName = "DEBUG";
      logMethod = console.log;
      break;
    case LOG_LEVELS.TRACE:
      levelName = "TRACE";
      logMethod = console.log;
      break;
    case LOG_LEVELS.VERBOSE:
      levelName = "VERBOSE";
      logMethod = console.log;
      break;
  }
  
  const logEntry = {
    timestamp,
    level: levelName,
    message,
    ...(data !== undefined ? { data: typeof data === 'object' ? data : { value: data } } : {})
  };
  
  logMethod(JSON.stringify(logEntry));
  
  // Enregistrer le log dans la base de données si possible
  try {
    supabase.from('acelle_sync_logs').insert({
      operation: 'edge_function_log',
      details: {
        level: levelName,
        message: message,
        data: data,
        timestamp: timestamp
      }
    }).then(() => {}, (err) => {
      console.error("Erreur lors de l'enregistrement du log dans la base de données:", err);
    });
  } catch (e) {
    // Ignorer les erreurs lors de l'enregistrement du log
  }
}

// Helper function pour tester l'accessibilité d'une URL avec diagnostic extensif
async function testEndpointAccess(url: string, options: { 
  timeout?: number, 
  headers?: Record<string, string>,
  authToken?: string,
  authMethod?: string
} = {}): Promise<{
  success: boolean,
  message: string,
  statusCode?: number,
  responseTime?: number,
  headers?: Record<string, string>,
  responseText?: string
}> {
  const startTime = Date.now();
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const authMethod = options.authMethod || 'token';
  
  try {
    debugLog(`Testing API accessibility for endpoint ${url}`, { timeout, headers: options.headers }, LOG_LEVELS.DEBUG);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Seventic-Acelle-Sync/1.5',
      ...(options.headers || {})
    };
    
    // Add authentication based on method if token is provided
    if (options.authToken) {
      if (authMethod === 'basic') {
        headers['Authorization'] = `Basic ${btoa(`${options.authToken}:`)}`;
      } else if (authMethod === 'header') {
        headers['X-API-Key'] = options.authToken;
      }
      // For 'token' method, the token is part of the URL query params
    }
    
    // Construct the final URL with token if using token auth method
    let finalUrl = url;
    if (options.authToken && authMethod === 'token') {
      const separator = url.includes('?') ? '&' : '?';
      finalUrl = `${url}${separator}api_token=${options.authToken}`;
    }
    
    debugLog(`Making API request to: ${finalUrl}`, { headers }, LOG_LEVELS.VERBOSE);
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    // Capture and log response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // Attempt to read response text for diagnostics
    let responseText = '';
    try {
      responseText = await response.text();
    } catch (e) {
      debugLog(`Could not read response text: ${e instanceof Error ? e.message : String(e)}`, {}, LOG_LEVELS.WARN);
    }
    
    if (response.ok) {
      debugLog(`URL accessible: ${finalUrl}, status: ${response.status}, time: ${responseTime}ms`, 
        { headers: responseHeaders, responseText: responseText.substring(0, 200) }, 
        LOG_LEVELS.DEBUG);
        
      return { 
        success: true, 
        message: `URL accessible: ${url}, status: ${response.status}, time: ${responseTime}ms`, 
        statusCode: response.status,
        responseTime,
        headers: responseHeaders,
        responseText: responseText.substring(0, 1000) // Limit response text size
      };
    } else {
      debugLog(`URL inaccessible: ${finalUrl}, status: ${response.status}, statusText: ${response.statusText}, time: ${responseTime}ms`,
        { headers: responseHeaders, responseText }, 
        LOG_LEVELS.WARN);
        
      return { 
        success: false, 
        message: `URL inaccessible: ${url}, status: ${response.status}, statusText: ${response.statusText}`, 
        statusCode: response.status,
        responseTime,
        headers: responseHeaders,
        responseText: responseText.substring(0, 1000) // Limit response text size
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    debugLog(`Error testing URL: ${url}, error: ${errorMessage}, time: ${responseTime}ms`, 
      { error }, 
      LOG_LEVELS.ERROR);
      
    return { 
      success: false, 
      message: `Erreur lors du test d'URL: ${url}, erreur: ${errorMessage}`,
      responseTime
    };
  }
}

// Heartbeat recording function
async function recordHeartbeat() {
  try {
    await supabase.from('acelle_sync_logs').insert({
      operation: 'heartbeat',
      details: { timestamp: new Date().toISOString() }
    });
    
    debugLog("Heartbeat recorded", {}, LOG_LEVELS.DEBUG);
    lastActivity = Date.now();
  } catch (error) {
    debugLog("Failed to record heartbeat:", error, LOG_LEVELS.ERROR);
  }
}

// Interface pour le format des campagnes Acelle
interface AcelleCampaign {
  uid: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_date?: string | null;
  run_at?: string | null;
  last_error?: string | null;
  statistics?: any;
  delivery_info?: any;
}

// Interface pour les statistiques des campagnes
interface AcelleCampaignStatistics {
  subscriber_count: number;
  delivered_count: number;
  delivered_rate: number;
  open_count: number;
  uniq_open_count?: number;
  uniq_open_rate: number;
  click_count: number;
  click_rate: number;
  bounce_count: number;
  soft_bounce_count: number;
  hard_bounce_count: number;
  unsubscribe_count: number;
  abuse_complaint_count: number;
  [key: string]: any;
}

// Structure pour les informations de livraison
interface DeliveryInfo {
  total?: number;
  delivery_rate?: number;
  unique_open_rate?: number;
  click_rate?: number;
  bounce_rate?: number;
  unsubscribe_rate?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  bounced?: {
    soft?: number;
    hard?: number;
    total?: number;
  } | number;
  unsubscribed?: number;
  complained?: number;
  bounce_count?: number;
  [key: string]: any;
}

// Récupère la liste des campagnes depuis l'API Acelle
async function fetchCampaigns(apiEndpoint: string, apiToken: string): Promise<AcelleCampaign[]> {
  try {
    const url = `${apiEndpoint}/campaigns?api_token=${apiToken}&page=1&per_page=100&sort_order=desc`;
    
    debugLog(`Récupération des campagnes depuis l'API Acelle: ${url.replace(apiToken, 'API_TOKEN_HIDDEN')}`, {}, LOG_LEVELS.INFO);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Erreur API lors de la récupération des campagnes: ${response.status} ${response.statusText}`, { error: errorText }, LOG_LEVELS.ERROR);
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const campaigns = data.data || [];
    
    debugLog(`${campaigns.length} campagnes récupérées depuis l'API`, {}, LOG_LEVELS.INFO);
    return campaigns;
    
  } catch (error) {
    debugLog(`Erreur lors de la récupération des campagnes`, { error }, LOG_LEVELS.ERROR);
    throw error;
  }
}

// Récupère les détails d'une campagne spécifique, incluant les statistiques
async function fetchCampaignDetails(apiEndpoint: string, apiToken: string, campaignUid: string): Promise<AcelleCampaign> {
  try {
    const url = `${apiEndpoint}/campaigns/${campaignUid}?api_token=${apiToken}`;
    
    debugLog(`[DÉTAIL CAMPAGNE] Récupération des détails de la campagne ${campaignUid} depuis l'API Acelle: ${url.replace(apiToken, 'API_TOKEN_HIDDEN')}`, {}, LOG_LEVELS.INFO);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`[ERREUR DÉTAIL] Erreur API lors de la récupération des détails de campagne: ${response.status} ${response.statusText}`, { error: errorText }, LOG_LEVELS.ERROR);
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const campaign = await response.json();
    debugLog(`[SUCCÈS DÉTAIL] Détails récupérés pour la campagne ${campaignUid}`, { 
      hasStatistics: !!campaign.statistics,
      statisticsKeys: campaign.statistics ? Object.keys(campaign.statistics) : [],
      openRate: campaign.statistics?.uniq_open_rate || 'non défini',
      clickRate: campaign.statistics?.click_rate || 'non défini'
    }, LOG_LEVELS.INFO);
    
    return campaign;
  } catch (error) {
    debugLog(`[ERREUR CRITIQUE] Erreur lors de la récupération des détails de campagne ${campaignUid}`, { error }, LOG_LEVELS.ERROR);
    throw error;
  }
}

// Stocke les données de campagne dans le cache Supabase
async function storeCampaignsInCache(accountId: string, campaigns: AcelleCampaign[]) {
  try {
    debugLog(`Préparation de ${campaigns.length} campagnes pour stockage en cache`, {}, LOG_LEVELS.INFO);
    
    const cacheEntries = campaigns.map(campaign => ({
      account_id: accountId,
      campaign_uid: campaign.uid,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      delivery_date: campaign.delivery_date || null,
      run_at: campaign.run_at || null,
      last_error: campaign.last_error || null,
      delivery_info: campaign.delivery_info || campaign.statistics || {},  // Stocke les statistiques dans delivery_info si disponibles
      cache_updated_at: new Date().toISOString()
    }));
    
    debugLog(`Insertion/mise à jour des données de campagne dans le cache`, {
      firstCampaign: cacheEntries.length > 0 ? {
        uid: cacheEntries[0].campaign_uid,
        hasDeliveryInfo: !!cacheEntries[0].delivery_info,
        deliveryInfoKeys: Object.keys(cacheEntries[0].delivery_info || {})
      } : 'Pas de campagnes'
    }, LOG_LEVELS.INFO);
    
    const { error } = await supabase
      .from('email_campaigns_cache')
      .upsert(cacheEntries, {
        onConflict: 'account_id,campaign_uid'
      });
      
    if (error) {
      debugLog(`Erreur lors de la mise à jour du cache des campagnes`, { error }, LOG_LEVELS.ERROR);
      throw error;
    }
    
    debugLog(`Cache des campagnes mis à jour avec succès`, {}, LOG_LEVELS.INFO);
    return cacheEntries.length;
    
  } catch (error) {
    debugLog(`Erreur lors du stockage des campagnes en cache`, { error }, LOG_LEVELS.ERROR);
    throw error;
  }
}

// Stocke les statistiques d'une campagne dans la table campaign_stats_cache
async function storeCampaignStatistics(accountId: string, campaignUid: string, statistics: AcelleCampaignStatistics) {
  try {
    debugLog(`[STATS CACHE] Stockage des statistiques pour la campagne ${campaignUid}`, {
      statisticsKeys: Object.keys(statistics || {}),
      openRate: statistics?.uniq_open_rate || 'non défini',
      clickRate: statistics?.click_rate || 'non défini'
    }, LOG_LEVELS.INFO);
    
    const { error } = await supabase
      .from('campaign_stats_cache')
      .upsert({
        account_id: accountId,
        campaign_uid: campaignUid,
        statistics: statistics,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'account_id,campaign_uid'
      });
      
    if (error) {
      debugLog(`[ERREUR STATS] Erreur lors du stockage des statistiques de campagne`, { error }, LOG_LEVELS.ERROR);
      throw error;
    }
    
    debugLog(`[SUCCÈS STATS] Statistiques de campagne stockées avec succès`, {}, LOG_LEVELS.INFO);
    
    // Vérifier que le trigger a bien mis à jour email_campaigns_cache
    const { data: updatedCache, error: cacheError } = await supabase
      .from('email_campaigns_cache')
      .select('delivery_info, cache_updated_at')
      .eq('account_id', accountId)
      .eq('campaign_uid', campaignUid)
      .single();
      
    if (cacheError) {
      debugLog(`[VÉRIF CACHE] Impossible de vérifier la mise à jour du cache`, { error: cacheError }, LOG_LEVELS.WARN);
    } else {
      debugLog(`[VÉRIF CACHE] Cache vérifié après mise à jour des stats`, { 
        hasDeliveryInfo: !!updatedCache.delivery_info,
        updatedAt: updatedCache.cache_updated_at,
        openRate: updatedCache.delivery_info?.uniq_open_rate || 'non défini',
        clickRate: updatedCache.delivery_info?.click_rate || 'non défini'
      }, LOG_LEVELS.INFO);
    }
    
    return true;
    
  } catch (error) {
    debugLog(`Erreur lors du stockage des statistiques de campagne`, { error }, LOG_LEVELS.ERROR);
    throw error;
  }
}

// Transforme les statistiques brutes en format DeliveryInfo pour la compatibilité
function transformStatisticsToDeliveryInfo(statistics: AcelleCampaignStatistics): DeliveryInfo {
  if (!statistics) return {};
  
  debugLog(`[TRANSFORM] Transformation des statistiques en format DeliveryInfo`, { 
    keysAvant: Object.keys(statistics || {}),
    openRate: statistics?.uniq_open_rate || 'non défini',
    clickRate: statistics?.click_rate || 'non défini'
  }, LOG_LEVELS.DEBUG);
  
  // Convertir les valeurs numériques en nombre si elles sont des chaînes
  const numericStats = Object.entries(statistics).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'string' ? parseFloat(value) : value;
    return acc;
  }, {} as Record<string, any>);
  
  // Format cohérent pour delivery_info
  const deliveryInfo = {
    total: numericStats.subscriber_count || 0,
    delivery_rate: numericStats.delivered_rate || 0,
    unique_open_rate: numericStats.uniq_open_rate || 0,
    click_rate: numericStats.click_rate || 0,
    bounce_rate: (numericStats.bounce_count && numericStats.subscriber_count) ? 
      (numericStats.bounce_count / numericStats.subscriber_count * 100) : 0,
    unsubscribe_rate: (numericStats.unsubscribe_count && numericStats.subscriber_count) ?
      (numericStats.unsubscribe_count / numericStats.subscriber_count * 100) : 0,
    delivered: numericStats.delivered_count || 0,
    opened: numericStats.open_count || 0,
    clicked: numericStats.click_count || 0,
    bounced: {
      soft: numericStats.soft_bounce_count || 0,
      hard: numericStats.hard_bounce_count || 0,
      total: numericStats.bounce_count || 0
    },
    unsubscribed: numericStats.unsubscribe_count || 0,
    complained: numericStats.abuse_complaint_count || 0,
    
    // Copier les autres statistiques importantes
    subscriber_count: numericStats.subscriber_count || 0,
    delivered_count: numericStats.delivered_count || 0,
    delivered_rate: numericStats.delivered_rate || 0,
    open_count: numericStats.open_count || 0,
    open_rate: numericStats.open_rate || 0,
    uniq_open_rate: numericStats.uniq_open_rate || 0
  };
  
  debugLog(`[TRANSFORM] DeliveryInfo généré`, { 
    keysApres: Object.keys(deliveryInfo),
    openRate: deliveryInfo.uniq_open_rate || 'non défini',
    clickRate: deliveryInfo.click_rate || 'non défini'
  }, LOG_LEVELS.DEBUG);
  
  return deliveryInfo;
}

// Met à jour les statistiques agrégées dans email_campaigns_stats
async function updateAggregatedStats(accountId: string) {
  try {
    debugLog(`[AGRÉGATION] Mise à jour des statistiques agrégées pour le compte ${accountId}`, {}, LOG_LEVELS.INFO);
    
    // Construction de la requête SQL pour agréger les statistiques
    const { data, error } = await supabase.rpc('update_acelle_campaign_stats', {
      account_id_param: accountId
    });
    
    if (error) {
      debugLog(`[ERREUR AGRÉGATION] Erreur lors de la mise à jour des statistiques agrégées`, { error }, LOG_LEVELS.ERROR);
      throw error;
    }
    
    // Vérifier si force_update_campaign_stats existe et l'utiliser si c'est le cas
    try {
      debugLog(`[FORCE UPDATE] Tentative d'appel à force_update_campaign_stats`, {}, LOG_LEVELS.INFO);
      const { data: forceData, error: forceError } = await supabase.rpc('force_update_campaign_stats', {
        account_id_param: accountId
      });
      
      if (forceError) {
        debugLog(`[ERREUR FORCE UPDATE] Fonction force_update_campaign_stats indisponible ou erreur`, { error: forceError }, LOG_LEVELS.WARN);
      } else {
        debugLog(`[SUCCÈS FORCE UPDATE] Mise à jour forcée réussie`, { result: forceData }, LOG_LEVELS.INFO);
      }
    } catch (forceError) {
      debugLog(`[EXCEPTION FORCE UPDATE] Erreur lors de la mise à jour forcée`, { error: forceError }, LOG_LEVELS.WARN);
    }
    
    debugLog(`[SUCCÈS AGRÉGATION] Statistiques agrégées mises à jour avec succès`, { result: data }, LOG_LEVELS.INFO);
    return true;
    
  } catch (error) {
    debugLog(`[ERREUR AGRÉGATION] Erreur lors de la mise à jour des statistiques agrégées`, { error }, LOG_LEVELS.ERROR);
    return false;
  }
}

// Fonction principale de synchronisation
async function synchronizeCampaigns(accountId: string, apiEndpoint: string, apiToken: string) {
  try {
    debugLog(`[DÉBUT SYNC] Début de synchronisation des campagnes pour le compte ${accountId}`, {
      endpoint: apiEndpoint
    }, LOG_LEVELS.INFO);
    
    // Enregistrer le début de la synchronisation
    const syncStartLog = await supabase.from('acelle_sync_logs').insert({
      operation: 'sync_campaigns',
      account_id: accountId,
      details: { 
        started_at: new Date().toISOString(),
        endpoint: apiEndpoint.replace(/\/$/, '') // sans slash final
      }
    }).select('id').single();
    
    const syncLogId = syncStartLog.data?.id;
    
    // 1. Récupérer la liste des campagnes
    const campaigns = await fetchCampaigns(apiEndpoint, apiToken);
    debugLog(`[LISTE CAMPAGNES] ${campaigns.length} campagnes récupérées`, {}, LOG_LEVELS.INFO);
    
    // 2. Pour chaque campagne, récupérer les détails détaillés incluant les statistiques
    const enrichedCampaigns = [];
    for (const campaign of campaigns) {
      try {
        debugLog(`[DÉTAILS] Récupération des détails pour la campagne ${campaign.uid}`, {
          name: campaign.name,
          subject: campaign.subject
        }, LOG_LEVELS.DEBUG);
        
        // Récupérer les détails complets de la campagne (incluant les statistiques)
        const campaignDetails = await fetchCampaignDetails(apiEndpoint, apiToken, campaign.uid);
        
        // Extraire les statistiques et les transformer en format DeliveryInfo
        const statistics = campaignDetails.statistics || {};
        const deliveryInfo = transformStatisticsToDeliveryInfo(statistics);
        
        // Enrichir la campagne avec les statistiques et le delivery_info
        const enrichedCampaign = {
          ...campaign,
          statistics: statistics,
          delivery_info: deliveryInfo
        };
        
        // Ajouter à la liste des campagnes enrichies
        enrichedCampaigns.push(enrichedCampaign);
        
        // Stocker les statistiques dans la table campaign_stats_cache
        if (statistics && Object.keys(statistics).length > 0) {
          await storeCampaignStatistics(accountId, campaign.uid, statistics);
        } else {
          debugLog(`[STATS VIDES] Pas de statistiques disponibles pour la campagne ${campaign.uid}`, {}, LOG_LEVELS.WARN);
        }
        
      } catch (error) {
        debugLog(`[ERREUR ENRICHISSEMENT] Erreur lors de l'enrichissement de la campagne ${campaign.uid}`, { error }, LOG_LEVELS.ERROR);
        
        // Ajouter la campagne sans enrichissement en cas d'erreur
        enrichedCampaigns.push(campaign);
      }
    }
    
    // 3. Stocker toutes les campagnes enrichies dans le cache
    const storedCount = await storeCampaignsInCache(accountId, enrichedCampaigns);
    debugLog(`[STOCKAGE] ${storedCount} campagnes ont été stockées dans le cache`, {}, LOG_LEVELS.INFO);
    
    // 4. Mettre à jour les statistiques agrégées
    await updateAggregatedStats(accountId);
    
    // 5. Mettre à jour le compte Acelle avec la date de la dernière synchronisation
    const { error } = await supabase
      .from('acelle_accounts')
      .update({ 
        last_sync_date: new Date().toISOString(),
        last_sync_error: null
      })
      .eq('id', accountId);
      
    if (error) {
      debugLog(`[ERREUR UPDATE COMPTE] Erreur lors de la mise à jour du compte Acelle`, { error }, LOG_LEVELS.ERROR);
    }
    
    // Mettre à jour les logs de synchronisation
    if (syncLogId) {
      await supabase.from('acelle_sync_logs').update({
        details: {
          completed_at: new Date().toISOString(),
          campaigns_count: campaigns.length,
          success: true
        }
      }).eq('id', syncLogId);
    }
    
    debugLog(`[SYNC TERMINÉE] Synchronisation des campagnes terminée avec succès`, {}, LOG_LEVELS.INFO);
    
    return {
      success: true,
      message: `${storedCount} campagnes synchronisées avec succès`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    debugLog(`[ERREUR SYNC] Échec de la synchronisation des campagnes: ${errorMessage}`, { error }, LOG_LEVELS.ERROR);
    
    // Mettre à jour le compte Acelle avec l'erreur
    try {
      await supabase
        .from('acelle_accounts')
        .update({ 
          last_sync_date: new Date().toISOString(),
          last_sync_error: errorMessage
        })
        .eq('id', accountId);
    } catch (updateError) {
      debugLog(`[ERREUR META] Erreur lors de la mise à jour du statut d'erreur`, { error: updateError }, LOG_LEVELS.ERROR);
    }
    
    return {
      success: false,
      message: `Échec de la synchronisation: ${errorMessage}`,
      timestamp: new Date().toISOString()
    };
  }
}

// Diagnostiquer les problèmes avec les statistiques de campagnes
async function diagnoseCampaignStats(accountId: string) {
  try {
    debugLog(`[DIAGNOSTIC] Début du diagnostic des statistiques pour le compte ${accountId}`, {}, LOG_LEVELS.INFO);
    
    // 1. Vérifier que les statistiques existent dans campaign_stats_cache
    const { data: statsCache, error: statsError } = await supabase
      .from('campaign_stats_cache')
      .select('campaign_uid, statistics')
      .eq('account_id', accountId);
      
    if (statsError) {
      debugLog(`[DIAG ERROR] Impossible de lire campaign_stats_cache`, { error: statsError }, LOG_LEVELS.ERROR);
      return { success: false, error: 'Erreur lecture stats cache' };
    }
    
    const statCount = statsCache?.length || 0;
    debugLog(`[DIAG STATS] ${statCount} entrées trouvées dans campaign_stats_cache`, {}, LOG_LEVELS.INFO);
    
    // 2. Vérifier que ces mêmes campagnes ont leurs statistiques dans email_campaigns_cache
    const { data: campaignsCache, error: campaignsError } = await supabase
      .from('email_campaigns_cache')
      .select('campaign_uid, delivery_info')
      .eq('account_id', accountId);
      
    if (campaignsError) {
      debugLog(`[DIAG ERROR] Impossible de lire email_campaigns_cache`, { error: campaignsError }, LOG_LEVELS.ERROR);
      return { success: false, error: 'Erreur lecture campaigns cache' };
    }
    
    const campaignCount = campaignsCache?.length || 0;
    debugLog(`[DIAG CAMPAIGNS] ${campaignCount} entrées trouvées dans email_campaigns_cache`, {}, LOG_LEVELS.INFO);
    
    // 3. Comparer les statistiques entre les deux tables
    const campaignMap = new Map();
    campaignsCache?.forEach(campaign => {
      campaignMap.set(campaign.campaign_uid, campaign.delivery_info);
    });
    
    const missingStats = [];
    const mismatchedStats = [];
    
    statsCache?.forEach(stat => {
      const campaignInfo = campaignMap.get(stat.campaign_uid);
      
      if (!campaignInfo) {
        missingStats.push(stat.campaign_uid);
      } else {
        // Vérifier si les statistiques sont synchronisées
        const statOpenRate = stat.statistics?.uniq_open_rate;
        const campaignOpenRate = campaignInfo?.uniq_open_rate;
        
        if (statOpenRate !== campaignOpenRate) {
          mismatchedStats.push({
            campaign_uid: stat.campaign_uid,
            stats_open_rate: statOpenRate,
            campaign_open_rate: campaignOpenRate
          });
        }
      }
    });
    
    debugLog(`[DIAG RÉSULTAT] Campagnes avec statistiques manquantes: ${missingStats.length}, incohérentes: ${mismatchedStats.length}`, {
      missing: missingStats,
      mismatched: mismatchedStats
    }, LOG_LEVELS.INFO);
    
    // 4. Forcer la mise à jour si nécessaire
    if (missingStats.length > 0 || mismatchedStats.length > 0) {
      debugLog(`[DIAG ACTION] Forçage de la mise à jour des statistiques`, {}, LOG_LEVELS.INFO);
      
      try {
        const { data: forceData, error: forceError } = await supabase.rpc('force_update_campaign_stats', {
          account_id_param: accountId
        });
        
        if (forceError) {
          debugLog(`[DIAG ERROR] Échec du forçage de la mise à jour`, { error: forceError }, LOG_LEVELS.ERROR);
        } else {
          debugLog(`[DIAG SUCCESS] Mise à jour forcée réussie`, { result: forceData }, LOG_LEVELS.INFO);
        }
      } catch (error) {
        debugLog(`[DIAG ERROR] Exception lors du forçage de la mise à jour`, { error }, LOG_LEVELS.ERROR);
      }
    }
    
    return {
      success: true,
      statCount,
      campaignCount,
      missingStats,
      mismatchedStats
    };
    
  } catch (error) {
    debugLog(`[DIAG CRITICAL] Erreur lors du diagnostic`, { error }, LOG_LEVELS.ERROR);
    return { success: false, error: String(error) };
  }
}

// Gestionnaire principal des requêtes
serve(async (req) => {
  // Configuration du niveau de log basée sur les headers
  const debugLevel = req.headers.get('x-debug-level');
  if (debugLevel && !isNaN(parseInt(debugLevel))) {
    currentLogLevel = parseInt(debugLevel);
    debugLog(`Niveau de debug défini à ${currentLogLevel}`, {}, LOG_LEVELS.INFO);
  }

  // Enregistrer le heartbeat pour le monitoring
  await recordHeartbeat();
  
  // Options request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Authentification et validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      debugLog('Échec d\'authentification: Token manquant ou invalide', {}, LOG_LEVELS.ERROR);
      return new Response(
        JSON.stringify({ error: 'Authentification requise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extraire les données de la requête
    let body;
    try {
      body = await req.json();
    } catch (error) {
      debugLog('Erreur lors du parsing du JSON', { error }, LOG_LEVELS.ERROR);
      return new Response(
        JSON.stringify({ error: 'Format JSON invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { accountId, apiToken, apiEndpoint, authMethod, action } = body;
    
    // Vérifier l'action demandée (diagnostic ou synchronisation)
    if (action === 'diagnose' && accountId) {
      debugLog(`Action diagnostique demandée pour le compte ${accountId}`, {}, LOG_LEVELS.INFO);
      const result = await diagnoseCampaignStats(accountId);
      
      return new Response(
        JSON.stringify(result),
        { 
          status: result.success ? 200 : 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Vérifier les paramètres requis pour la synchronisation
    if (!accountId) {
      debugLog('Requête invalide: accountId manquant', {}, LOG_LEVELS.ERROR);
      return new Response(
        JSON.stringify({ error: 'Paramètre accountId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    debugLog(`Synchronisation demandée pour le compte Acelle ${accountId}`, { authMethod }, LOG_LEVELS.INFO);
    
    // Si apiToken ou apiEndpoint ne sont pas fournis, les récupérer de la base de données
    let finalApiToken = apiToken;
    let finalApiEndpoint = apiEndpoint;
    
    if (!finalApiToken || !finalApiEndpoint) {
      debugLog('Récupération des détails du compte depuis Supabase', {}, LOG_LEVELS.INFO);
      
      const { data: account, error } = await supabase
        .from('acelle_accounts')
        .select('api_token, api_endpoint')
        .eq('id', accountId)
        .single();
        
      if (error || !account) {
        debugLog(`Compte Acelle non trouvé: ${accountId}`, { error }, LOG_LEVELS.ERROR);
        return new Response(
          JSON.stringify({ error: 'Compte Acelle non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      finalApiToken = account.api_token;
      finalApiEndpoint = account.api_endpoint;
    }
    
    // Nettoyer l'URL de l'API (enlever le slash final si présent)
    finalApiEndpoint = finalApiEndpoint.replace(/\/$/, '');
    
    // Exécuter la synchronisation
    const result = await synchronizeCampaigns(accountId, finalApiEndpoint, finalApiToken);
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debugLog(`Erreur non gérée dans le gestionnaire principal: ${errorMessage}`, { error }, LOG_LEVELS.ERROR);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
