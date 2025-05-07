
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
    const apiPath = `/campaigns/${campaign.uid}/statistics`;
    
    // Utiliser fetchViaProxy avec retry
    const response = await fetchViaProxy(
      apiPath, 
      { method: 'GET' }, 
      account.api_token, 
      account.api_endpoint, 
      1
    );
    
    if (!response.ok) {
      throw new Error(`Erreur API ${response.status}`);
    }
    
    const data = await response.json();
    
    // Créer un objet statistiques correctement typé
    const statistics: AcelleCampaignStatistics = {
      subscriber_count: Number(data.subscriber_count ?? 0),
      delivered_count: Number(data.delivered_count ?? 0),
      delivered_rate: Number(data.delivered_rate ?? 0),
      open_count: Number(data.open_count ?? 0),
      uniq_open_rate: Number(data.uniq_open_rate ?? 0),
      click_count: Number(data.click_count ?? 0),
      click_rate: Number(data.click_rate ?? 0),
      bounce_count: Number(data.bounce_count ?? 0),
      soft_bounce_count: Number(data.soft_bounce_count ?? 0),
      hard_bounce_count: Number(data.hard_bounce_count ?? 0),
      unsubscribe_count: Number(data.unsubscribe_count ?? 0),
      abuse_complaint_count: Number(data.abuse_complaint_count ?? 0),
      open_rate: Number(data.open_rate ?? 0)
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
