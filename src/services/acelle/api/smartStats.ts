
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { fetchCampaignStats } from "@/utils/acelle/campaignStatusUtils";
import { getCachedStats, updateCachedStats, getBulkCachedStats, hasValidStatistics } from "@/services/statsCache";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SmartStatsOptions {
  forceRefresh?: boolean;
  timeout?: number;
  quietMode?: boolean;
}

/**
 * Récupère les statistiques d'une campagne de manière intelligente
 * - Utilise le cache si disponible et frais
 * - Sinon, récupère depuis l'API et met à jour le cache
 */
export const getSmartCampaignStats = async (
  campaign: AcelleCampaign,
  account: AcelleAccount,
  options: SmartStatsOptions = {}
): Promise<AcelleCampaignStatistics | null> => {
  const { forceRefresh = false, quietMode = false } = options;
  const campaignUid = campaign.uid || campaign.campaign_uid;
  
  if (!campaignUid || !account?.id) {
    console.error("Identifiants de campagne ou de compte manquants");
    return null;
  }
  
  try {
    // 1. Vérifier d'abord le cache (sauf si forceRefresh est true)
    if (!forceRefresh) {
      const { statistics, isFresh } = await getCachedStats(campaignUid, account.id);
      
      // Utiliser les statistiques en cache si elles sont fraîches et valides
      if (statistics && (isFresh || !options.forceRefresh) && hasValidStatistics(statistics)) {
        console.log(`Utilisation des statistiques en cache pour ${campaign.name || campaignUid}`);
        return statistics;
      }
    }
    
    // 2. Récupérer depuis l'API si le cache n'est pas frais ou forceRefresh est true
    console.log(`Récupération des statistiques depuis l'API pour ${campaign.name || campaignUid}`);
    
    // Récupérer un token d'authentification pour les appels API
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      if (!quietMode) toast.error("Authentification requise pour récupérer les statistiques");
      console.error("Token d'authentification manquant");
      return null;
    }
    
    // Récupérer les statistiques depuis l'API
    const apiStats = await fetchCampaignStats(
      campaignUid,
      account.apiEndpoint,
      account.apiToken
    );
    
    if (!apiStats) {
      console.log(`Pas de statistiques API pour ${campaign.name || campaignUid}`);
      
      // Si des statistiques existantes sont disponibles dans l'objet campaign, les utiliser
      if (campaign.statistics && hasValidStatistics(campaign.statistics)) {
        console.log(`Utilisation des statistiques existantes pour ${campaign.name || campaignUid}`);
        
        // Mise à jour du cache avec les statistiques existantes
        await updateCachedStats(campaignUid, account.id, campaign.statistics);
        return campaign.statistics;
      }
      
      return null;
    }
    
    // Convertir les statistiques API en format AcelleCampaignStatistics
    const mappedStats: AcelleCampaignStatistics = mapApiStatsToModel(apiStats, campaignUid);
    
    // Mise à jour du cache uniquement si les statistiques sont valides
    if (hasValidStatistics(mappedStats)) {
      console.log(`Mise à jour du cache pour ${campaign.name || campaignUid}`);
      await updateCachedStats(campaignUid, account.id, mappedStats);
    }
    
    return mappedStats;
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour ${campaign.name || campaignUid}:`, error);
    
    // En cas d'erreur, essayer d'utiliser les statistiques existantes ou celles en cache même si expirées
    if (campaign.statistics && hasValidStatistics(campaign.statistics)) {
      return campaign.statistics;
    }
    
    const { statistics } = await getCachedStats(campaignUid, account.id);
    if (statistics && hasValidStatistics(statistics)) {
      return statistics;
    }
    
    return null;
  }
};

/**
 * Récupère les statistiques pour plusieurs campagnes de manière efficace
 */
export const getBulkSmartCampaignStats = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options: SmartStatsOptions = {}
): Promise<Record<string, AcelleCampaignStatistics>> => {
  if (!campaigns.length || !account?.id) {
    return {};
  }
  
  const { forceRefresh = false } = options;
  const result: Record<string, AcelleCampaignStatistics> = {};
  
  try {
    // Extraire les identifiants de campagne
    const campaignUids = campaigns.map(c => c.uid || c.campaign_uid).filter(Boolean) as string[];
    
    // 1. Récupérer les données en cache pour toutes les campagnes
    const cachedStats = !forceRefresh ? await getBulkCachedStats(campaignUids, account.id) : {};
    
    // Campagnes à rafraîchir (celles sans cache frais)
    const campaignsToRefresh = campaigns.filter(c => {
      const uid = c.uid || c.campaign_uid;
      if (!uid) return false;
      
      return forceRefresh || !cachedStats[uid] || !cachedStats[uid].isFresh;
    });
    
    // 2. Pour les campagnes avec cache frais, utiliser directement le cache
    campaigns.forEach(campaign => {
      const uid = campaign.uid || campaign.campaign_uid;
      if (!uid) return;
      
      // Si le cache est frais, l'utiliser
      if (!forceRefresh && cachedStats[uid] && cachedStats[uid].isFresh) {
        result[uid] = cachedStats[uid].statistics;
      }
    });
    
    // 3. Pour les campagnes à rafraîchir, récupérer les statistiques individuellement
    if (campaignsToRefresh.length > 0) {
      console.log(`Rafraîchissement des statistiques pour ${campaignsToRefresh.length} campagnes`);
      
      // Récupérer un token d'authentification
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        console.error("Token d'authentification manquant pour la récupération en masse");
        
        // Utiliser le cache existant comme fallback, même s'il n'est pas frais
        campaignsToRefresh.forEach(campaign => {
          const uid = campaign.uid || campaign.campaign_uid;
          if (!uid) return;
          
          if (cachedStats[uid] && hasValidStatistics(cachedStats[uid].statistics)) {
            result[uid] = cachedStats[uid].statistics;
          } else if (campaign.statistics && hasValidStatistics(campaign.statistics)) {
            result[uid] = campaign.statistics;
          }
        });
        
        return result;
      }
      
      // Traiter chaque campagne à rafraîchir séquentiellement pour éviter de surcharger l'API
      for (const campaign of campaignsToRefresh) {
        const uid = campaign.uid || campaign.campaign_uid;
        if (!uid) continue;
        
        // Récupérer les statistiques individuellement
        const stats = await getSmartCampaignStats(campaign, account, {
          ...options,
          forceRefresh: true,
          quietMode: true
        });
        
        // Si des statistiques valides sont trouvées, les ajouter au résultat
        if (stats && hasValidStatistics(stats)) {
          result[uid] = stats;
        }
        // Sinon, essayer d'utiliser le cache même s'il n'est pas frais
        else if (cachedStats[uid] && hasValidStatistics(cachedStats[uid].statistics)) {
          result[uid] = cachedStats[uid].statistics;
        }
        // En dernier recours, utiliser les statistiques existantes
        else if (campaign.statistics && hasValidStatistics(campaign.statistics)) {
          result[uid] = campaign.statistics;
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération en masse des statistiques:", error);
    return result;
  }
};

/**
 * Convertit les statistiques API en modèle AcelleCampaignStatistics
 */
const mapApiStatsToModel = (
  apiStats: any, 
  campaignUid: string
): AcelleCampaignStatistics => {
  try {
    // Si l'API retourne directement des statistiques dans le bon format
    if (apiStats.statistics) {
      return apiStats.statistics as AcelleCampaignStatistics;
    }
    
    // Sinon, essayer de mapper manuellement
    const mappedStats: AcelleCampaignStatistics = {
      subscriber_count: parseInt(apiStats.subscriber_count || apiStats.total || '0'),
      delivered_count: parseInt(apiStats.delivered_count || apiStats.delivered || '0'),
      delivered_rate: parseFloat(apiStats.delivered_rate || apiStats.delivery_rate || '0'),
      open_count: parseInt(apiStats.open_count || apiStats.opened || '0'),
      uniq_open_count: parseInt(apiStats.uniq_open_count || apiStats.unique_opens || '0'),
      uniq_open_rate: parseFloat(apiStats.uniq_open_rate || apiStats.unique_open_rate || '0'),
      click_count: parseInt(apiStats.click_count || apiStats.clicked || '0'),
      click_rate: parseFloat(apiStats.click_rate || '0'),
      bounce_count: parseInt(apiStats.bounce_count || (apiStats.bounced?.total) || '0'),
      soft_bounce_count: parseInt(apiStats.soft_bounce_count || (apiStats.bounced?.soft) || '0'),
      hard_bounce_count: parseInt(apiStats.hard_bounce_count || (apiStats.bounced?.hard) || '0'),
      unsubscribe_count: parseInt(apiStats.unsubscribe_count || apiStats.unsubscribed || '0'),
      abuse_complaint_count: parseInt(apiStats.abuse_complaint_count || apiStats.complained || '0')
    };
    
    return mappedStats;
  } catch (error) {
    console.error(`Erreur lors du mapping des statistiques pour ${campaignUid}:`, error);
    return {} as AcelleCampaignStatistics;
  }
};
