
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from '@/integrations/supabase/client';
import { fetchViaProxy } from "../cors-proxy";

/**
 * Crée des statistiques vides pour une campagne
 */
export function createEmptyStatistics(): AcelleCampaignStatistics {
  return {
    subscriber_count: 0,
    delivered_count: 0,
    delivered_rate: 0,
    open_count: 0,
    uniq_open_rate: 0,
    click_count: 0,
    click_rate: 0,
    bounce_count: 0,
    soft_bounce_count: 0,
    hard_bounce_count: 0,
    unsubscribe_count: 0,
    abuse_complaint_count: 0,
    open_rate: 0
  };
}

/**
 * Récupère les statistiques d'une campagne depuis le cache
 */
export async function getCampaignStatsFromCache(
  campaignId: string,
  accountId: string
): Promise<AcelleCampaignStatistics | null> {
  try {
    const { data, error } = await supabase
      .from('campaign_stats_cache')
      .select('statistics')
      .eq('campaign_uid', campaignId)
      .eq('account_id', accountId)
      .single();
    
    if (error) {
      console.error("Erreur lors de la récupération des stats:", error);
      return null;
    }
    
    if (data && data.statistics) {
      // Conversion sécurisée avec vérification du type
      const stats = data.statistics as Record<string, any>;
      
      // Création d'un objet correctement typé avec valeurs par défaut si nécessaire
      const typedStats: AcelleCampaignStatistics = {
        subscriber_count: Number(stats.subscriber_count ?? 0),
        delivered_count: Number(stats.delivered_count ?? 0),
        delivered_rate: Number(stats.delivered_rate ?? 0),
        open_count: Number(stats.open_count ?? 0),
        uniq_open_rate: Number(stats.uniq_open_rate ?? 0),
        click_count: Number(stats.click_count ?? 0),
        click_rate: Number(stats.click_rate ?? 0),
        bounce_count: Number(stats.bounce_count ?? 0),
        soft_bounce_count: Number(stats.soft_bounce_count ?? 0),
        hard_bounce_count: Number(stats.hard_bounce_count ?? 0),
        unsubscribe_count: Number(stats.unsubscribe_count ?? 0),
        abuse_complaint_count: Number(stats.abuse_complaint_count ?? 0),
        open_rate: Number(stats.open_rate ?? 0)
      };
      
      return typedStats;
    }
    
    return null;
  } catch (error) {
    console.error("Exception lors de la récupération des stats:", error);
    return null;
  }
}

/**
 * Sauvegarde les statistiques d'une campagne dans le cache
 */
export async function saveCampaignStatsToCache(
  campaignId: string,
  accountId: string,
  statistics: AcelleCampaignStatistics
): Promise<boolean> {
  try {
    // Convertir les statistiques en objet JSON compatible avec Supabase
    const statsForDb = {
      subscriber_count: statistics.subscriber_count,
      delivered_count: statistics.delivered_count,
      delivered_rate: statistics.delivered_rate,
      open_count: statistics.open_count,
      uniq_open_rate: statistics.uniq_open_rate,
      click_count: statistics.click_count,
      click_rate: statistics.click_rate,
      bounce_count: statistics.bounce_count,
      soft_bounce_count: statistics.soft_bounce_count,
      hard_bounce_count: statistics.hard_bounce_count,
      unsubscribe_count: statistics.unsubscribe_count,
      abuse_complaint_count: statistics.abuse_complaint_count,
      open_rate: statistics.open_rate
    };
    
    const { error } = await supabase
      .from('campaign_stats_cache')
      .upsert({
        campaign_uid: campaignId,
        account_id: accountId,
        statistics: statsForDb,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'campaign_uid,account_id'
      });
    
    if (error) {
      console.error("Erreur lors de la sauvegarde des stats:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception lors de la sauvegarde des stats:", error);
    return false;
  }
}

/**
 * Récupère les statistiques d'une campagne directement depuis l'API
 */
export async function fetchCampaignStatsFromApi(
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options?: { forceRefresh?: boolean }
): Promise<AcelleCampaignStatistics> {
  try {
    // Vérifier d'abord le cache si on ne force pas le rafraîchissement
    if (!options?.forceRefresh) {
      const cachedStats = await getCampaignStatsFromCache(campaign.uid, account.id);
      if (cachedStats) {
        return cachedStats;
      }
    }
    
    // Si pas en cache ou force refresh, récupérer depuis l'API
    const apiPath = `campaigns/${campaign.uid}/statistics`;
    
    // Utiliser fetchViaProxy avec retry
    const response = await fetchViaProxy(
      apiPath, 
      { method: 'GET' }, 
      account.api_token, 
      account.api_endpoint, 
      2 // Augmenter le nombre de tentatives pour plus de fiabilité
    );
    
    if (!response.ok) {
      console.error(`Erreur API ${response.status} pour les statistiques`);
      throw new Error(`Erreur API ${response.status}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("Erreur lors du parsing de la réponse JSON:", e);
      throw new Error("Format de réponse API invalide");
    }
    
    // Validation des données reçues
    if (!data) {
      console.error("Données API vides");
      throw new Error("Aucune donnée reçue de l'API");
    }
    
    // Création d'un objet statistiques correctement typé en extrayant les valeurs de data
    const statistics: AcelleCampaignStatistics = {
      subscriber_count: Number(data?.subscriber_count ?? 0),
      delivered_count: Number(data?.delivered_count ?? 0),
      delivered_rate: Number(data?.delivered_rate ?? 0),
      open_count: Number(data?.open_count ?? 0),
      uniq_open_rate: Number(data?.uniq_open_rate ?? 0),
      click_count: Number(data?.click_count ?? 0),
      click_rate: Number(data?.click_rate ?? 0),
      bounce_count: Number(data?.bounce_count ?? 0),
      soft_bounce_count: Number(data?.soft_bounce_count ?? 0),
      hard_bounce_count: Number(data?.hard_bounce_count ?? 0),
      unsubscribe_count: Number(data?.unsubscribe_count ?? 0),
      abuse_complaint_count: Number(data?.abuse_complaint_count ?? 0),
      open_rate: Number(data?.open_rate ?? 0)
    };
    
    // Mettre à jour le cache
    await saveCampaignStatsToCache(campaign.uid, account.id, statistics);
    
    return statistics;
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques depuis l'API:", error);
    
    // Retourner des statistiques vides en cas d'erreur
    return createEmptyStatistics();
  }
}

/**
 * Fonction pour tester l'insertion dans le cache des statistiques
 * Cette fonction permet de vérifier que le mécanisme de cache fonctionne correctement
 */
export async function testCacheInsertion(account: AcelleAccount): Promise<boolean> {
  try {
    // Créer des statistiques de test
    const testStats: AcelleCampaignStatistics = {
      subscriber_count: 100,
      delivered_count: 95,
      delivered_rate: 95,
      open_count: 50,
      uniq_open_rate: 50,
      click_count: 25,
      click_rate: 25,
      bounce_count: 5,
      soft_bounce_count: 3,
      hard_bounce_count: 2,
      unsubscribe_count: 1,
      abuse_complaint_count: 0,
      open_rate: 50
    };
    
    // Utiliser un ID de campagne de test
    const testCampaignId = "test-campaign-" + Date.now();
    
    // Tenter d'insérer dans le cache
    const result = await saveCampaignStatsToCache(testCampaignId, account.id, testStats);
    
    if (!result) {
      console.error("Échec du test d'insertion dans le cache");
      return false;
    }
    
    // Vérifier que les données sont bien dans le cache
    const retrievedStats = await getCampaignStatsFromCache(testCampaignId, account.id);
    
    if (!retrievedStats) {
      console.error("Échec de la récupération des données de test depuis le cache");
      return false;
    }
    
    console.log("Test du cache réussi", retrievedStats);
    return true;
  } catch (error) {
    console.error("Exception lors du test du cache:", error);
    return false;
  }
}

/**
 * Vérifie la connectivité directe avec l'API Acelle (diagnostic d'API)
 */
export async function checkDirectApiConnection(account: AcelleAccount): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  if (!account || !account.api_endpoint || !account.api_token) {
    return { 
      success: false, 
      message: "Configuration du compte incomplète"
    };
  }
  
  try {
    // Tenter une requête ping (ou toute autre méthode disponible)
    console.log(`Test direct de l'API Acelle pour ${account.name}`);
    
    const apiPath = "ping";  // ou "me" selon l'API
    
    const response = await fetchViaProxy(
      apiPath,
      { method: "GET" },
      account.api_token,
      account.api_endpoint,
      3  // Plus de tentatives pour le diagnostic
    );
    
    // Vérifie si la réponse est ok
    if (response.ok) {
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { text: await response.text() };
      }
      
      return {
        success: true,
        message: "Connexion à l'API Acelle établie avec succès",
        details: {
          status: response.status,
          responseData
        }
      };
    } else {
      // Si ping échoue, essayer une autre route comme /campaigns
      console.log("Ping a échoué, tentative avec /campaigns...");
      const campaignsResponse = await fetchViaProxy(
        "campaigns",
        { method: "GET" },
        account.api_token,
        account.api_endpoint,
        2
      );
      
      if (campaignsResponse.ok) {
        return {
          success: true,
          message: "Connexion à l'API Acelle établie via /campaigns",
          details: {
            status: campaignsResponse.status,
            note: "La méthode ping n'est pas disponible, mais l'API est fonctionnelle"
          }
        };
      } else {
        return {
          success: false,
          message: `Échec de la connexion à l'API: ${response.status} ${response.statusText}`,
          details: {
            status: response.status,
            campaigns_status: campaignsResponse.status
          }
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erreur de connexion: ${error instanceof Error ? error.message : String(error)}`,
      details: { error: String(error) }
    };
  }
}
