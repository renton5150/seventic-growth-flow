
import { toast } from "sonner";
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from '@/integrations/supabase/client';
import { generateSimulatedStats } from "./statsGeneration";

// URL de base pour les requêtes directes à Acelle
const CORS_PROXY = '/cors-proxy';

/**
 * Récupère directement les statistiques d'une campagne depuis l'API Acelle
 * Cette fonction contourne les problèmes des méthodes précédentes
 */
export const fetchCampaignStatsDirectly = async (
  campaign: AcelleCampaign,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  if (!campaign || !account || !campaign.uid) {
    console.error("Paramètres manquants pour fetchCampaignStatsDirectly");
    return null;
  }
  
  try {
    const campaignUid = campaign.uid || campaign.campaign_uid;
    console.log(`Récupération directe des statistiques pour ${campaign.name} (${campaignUid})`);
    
    // Vérifier si l'API endpoint est disponible
    if (!account.apiEndpoint || !account.apiToken) {
      console.error("Configuration API manquante pour le compte Acelle");
      return null;
    }
    
    // Construire l'URL avec timestamp pour éviter la mise en cache
    const timestamp = new Date().getTime();
    const apiEndpoint = account.apiEndpoint.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
      
    // URL pour récupérer les détails d'une campagne spécifique avec ses statistiques
    const url = `${CORS_PROXY}?url=${encodeURIComponent(
      `${apiEndpoint}/api/v1/campaigns/${campaignUid}?api_token=${account.apiToken}&include_stats=true&_t=${timestamp}`
    )}`;
    
    console.log(`Requête API directe: ${url}`);
    
    // Effectuer la requête à travers le proxy CORS
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Acelle-Key': account.apiToken
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API (${response.status}): ${errorText}`);
      throw new Error(`Erreur API: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Réponse API pour ${campaign.name}:`, data);
    
    // Vérifier si la réponse contient des statistiques
    if (!data || !data.statistics) {
      console.warn(`Aucune statistique disponible pour ${campaign.name}`);
      return null;
    }
    
    // Convertir les statistiques au format attendu
    const stats: AcelleCampaignStatistics = {
      subscriber_count: parseInt(data.statistics.subscriber_count) || 0,
      delivered_count: parseInt(data.statistics.delivered_count) || 0,
      delivered_rate: parseFloat(data.statistics.delivered_rate) || 0,
      open_count: parseInt(data.statistics.open_count) || 0,
      uniq_open_rate: parseFloat(data.statistics.uniq_open_rate) || 0,
      click_count: parseInt(data.statistics.click_count) || 0,
      click_rate: parseFloat(data.statistics.click_rate) || 0,
      bounce_count: parseInt(data.statistics.bounce_count) || 0,
      soft_bounce_count: parseInt(data.statistics.soft_bounce_count) || 0,
      hard_bounce_count: parseInt(data.statistics.hard_bounce_count) || 0,
      unsubscribe_count: parseInt(data.statistics.unsubscribe_count) || 0,
      abuse_complaint_count: parseInt(data.statistics.abuse_complaint_count) || 0
    };
    
    // Enregistrer en cache
    saveCampaignStatsToCache(campaignUid, account.id, stats);
    
    return stats;
  } catch (error) {
    console.error(`Erreur lors de la récupération directe des statistiques pour ${campaign.name}:`, error);
    return null;
  }
};

/**
 * Enregistre les statistiques récupérées dans le cache
 */
const saveCampaignStatsToCache = async (
  campaignUid: string,
  accountId: string,
  statistics: AcelleCampaignStatistics
) => {
  try {
    // Convertir les statistiques en format delivery_info
    const deliveryInfo = {
      total: statistics.subscriber_count,
      delivered: statistics.delivered_count,
      delivery_rate: statistics.delivered_rate,
      opened: statistics.open_count,
      unique_open_rate: statistics.uniq_open_rate,
      clicked: statistics.click_count,
      click_rate: statistics.click_rate,
      bounced: {
        soft: statistics.soft_bounce_count,
        hard: statistics.hard_bounce_count,
        total: statistics.bounce_count
      },
      unsubscribed: statistics.unsubscribe_count,
      complained: statistics.abuse_complaint_count
    };
    
    // Mettre à jour le cache
    const { error } = await supabase.from('email_campaigns_cache').upsert({
      campaign_uid: campaignUid,
      account_id: accountId,
      delivery_info: deliveryInfo,
      direct_fetch_at: new Date().toISOString(),
      cache_updated_at: new Date().toISOString()
    }, { onConflict: 'campaign_uid' });
    
    if (error) {
      console.error("Erreur lors de l'enregistrement des statistiques en cache:", error);
    } else {
      console.log(`Statistiques pour ${campaignUid} enregistrées en cache avec succès`);
    }
  } catch (err) {
    console.error("Erreur lors de l'enregistrement des statistiques en cache:", err);
  }
};

/**
 * Fonction pour rafraîchir les statistiques de toutes les campagnes d'un compte
 */
export const refreshAllCampaignStats = async (account: AcelleAccount): Promise<boolean> => {
  if (!account) return false;
  
  try {
    toast.loading("Rafraîchissement des statistiques...", { id: "refresh-all-stats" });
    
    // Récupérer toutes les campagnes du compte depuis le cache
    const { data: campaigns, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', account.id)
      .order('updated_at', { ascending: false })
      .limit(10); // Limiter pour éviter de surcharger l'API
    
    if (error) {
      console.error("Erreur lors de la récupération des campagnes:", error);
      toast.error("Erreur lors du rafraîchissement des statistiques", { id: "refresh-all-stats" });
      return false;
    }
    
    if (!campaigns || campaigns.length === 0) {
      console.log("Aucune campagne trouvée pour ce compte");
      toast.info("Aucune campagne trouvée pour ce compte", { id: "refresh-all-stats" });
      return false;
    }
    
    console.log(`Rafraîchissement des statistiques pour ${campaigns.length} campagnes`);
    
    // Traiter les 5 campagnes les plus récentes en parallèle
    const refreshPromises = campaigns.slice(0, 5).map(async (cachedCampaign) => {
      try {
        // Convertir le format cache en format campagne
        const campaign: AcelleCampaign = {
          uid: cachedCampaign.campaign_uid,
          name: cachedCampaign.name || '',
          subject: cachedCampaign.subject || '',
          status: cachedCampaign.status || '',
          created_at: cachedCampaign.created_at || '',
          updated_at: cachedCampaign.updated_at || '',
          delivery_date: cachedCampaign.delivery_date,
          run_at: cachedCampaign.run_at
        };
        
        // Récupérer directement les statistiques
        const stats = await fetchCampaignStatsDirectly(campaign, account);
        return { campaign: cachedCampaign.campaign_uid, success: !!stats };
      } catch (e) {
        console.error(`Erreur pour la campagne ${cachedCampaign.campaign_uid}:`, e);
        return { campaign: cachedCampaign.campaign_uid, success: false };
      }
    });
    
    // Attendre la complétion de toutes les requêtes
    const results = await Promise.all(refreshPromises);
    const successCount = results.filter(r => r.success).length;
    
    if (successCount > 0) {
      toast.success(`Statistiques rafraîchies pour ${successCount} campagnes`, { id: "refresh-all-stats" });
      return true;
    } else {
      toast.warning("Aucune statistique n'a pu être rafraîchie", { id: "refresh-all-stats" });
      return false;
    }
  } catch (error) {
    console.error("Erreur lors du rafraîchissement des statistiques:", error);
    toast.error("Erreur lors du rafraîchissement des statistiques", { id: "refresh-all-stats" });
    return false;
  }
};

/**
 * Récupère les statistiques de toutes les campagnes affichées
 * à utiliser avec le composant TableContent
 */
export const fetchStatsBatch = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount
): Promise<AcelleCampaign[]> => {
  if (!campaigns || campaigns.length === 0 || !account) {
    return campaigns;
  }
  
  console.log(`Récupération en lot des statistiques pour ${campaigns.length} campagnes`);
  
  // Créer une copie profonde des campagnes pour éviter de modifier les props
  const updatedCampaigns = JSON.parse(JSON.stringify(campaigns)) as AcelleCampaign[];
  
  // Traiter chaque campagne en parallèle
  const statsPromises = updatedCampaigns.map(async (campaign, index) => {
    try {
      // Récupérer les statistiques directement depuis l'API
      const stats = await fetchCampaignStatsDirectly(campaign, account);
      
      if (stats) {
        // Mettre à jour les statistiques de la campagne
        updatedCampaigns[index].statistics = stats;
        
        // Créer le delivery_info pour la compatibilité
        updatedCampaigns[index].delivery_info = {
          total: stats.subscriber_count,
          delivered: stats.delivered_count,
          opened: stats.open_count,
          clicked: stats.click_count,
          bounced: {
            total: stats.bounce_count,
            soft: stats.soft_bounce_count,
            hard: stats.hard_bounce_count
          },
          unsubscribed: stats.unsubscribe_count,
          complained: stats.abuse_complaint_count,
          delivery_rate: stats.delivered_rate,
          unique_open_rate: stats.uniq_open_rate,
          click_rate: stats.click_rate
        };
      } else {
        console.log(`Pas de statistiques disponibles pour ${campaign.name}, utilisation de données simulées`);
        // Utiliser des statistiques simulées en cas d'échec
        const { statistics, delivery_info } = generateSimulatedStats();
        updatedCampaigns[index].statistics = statistics;
        updatedCampaigns[index].delivery_info = delivery_info;
      }
    } catch (error) {
      console.error(`Erreur pour la campagne ${campaign.name}:`, error);
      // Utiliser des statistiques simulées en cas d'erreur
      const { statistics, delivery_info } = generateSimulatedStats();
      updatedCampaigns[index].statistics = statistics;
      updatedCampaigns[index].delivery_info = delivery_info;
    }
    
    return updatedCampaigns[index];
  });
  
  // Attendre toutes les requêtes en parallèle
  await Promise.all(statsPromises);
  
  console.log('Récupération des statistiques en lot terminée:', updatedCampaigns.map(c => c.name));
  return updatedCampaigns;
};
