
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { buildProxyUrl } from "../acelle-service";
import { supabase } from "@/integrations/supabase/client";

/**
 * Crée des statistiques de campagne vides
 */
export const createEmptyStatistics = (): AcelleCampaignStatistics => ({
  subscriber_count: 0,
  delivered_count: 0,
  delivered_rate: 0,
  open_count: 0,
  open_rate: 0,
  uniq_open_rate: 0,
  click_count: 0,
  click_rate: 0,
  bounce_count: 0,
  soft_bounce_count: 0,
  hard_bounce_count: 0,
  unsubscribe_count: 0,
  abuse_complaint_count: 0
});

/**
 * Vérifie si le cache est toujours frais
 */
const isCacheFresh = (lastUpdated: string | undefined, maxAge: number): boolean => {
  if (!lastUpdated) return false;
  const lastUpdatedDate = new Date(lastUpdated);
  const now = Date.now();
  return now - lastUpdatedDate.getTime() < maxAge;
};

/**
 * Fonction de test pour l'insertion dans le cache
 * Utilisée par DeliveryStatsChart pour tester le mécanisme de cache
 */
export const testCacheInsertion = async (
  account: AcelleAccount
): Promise<boolean> => {
  try {
    console.log("Test d'insertion dans le cache des statistiques...");
    
    // Création d'un ID de campagne de test
    const testCampaignUid = `test-${Date.now()}`;
    
    // Création de statistiques de test
    const testStats: AcelleCampaignStatistics = {
      subscriber_count: 100,
      delivered_count: 95,
      delivered_rate: 0.95,
      open_count: 50,
      open_rate: 0.45,
      uniq_open_rate: 0.45,
      click_count: 30,
      click_rate: 0.30,
      bounce_count: 5,
      soft_bounce_count: 3,
      hard_bounce_count: 2,
      unsubscribe_count: 2,
      abuse_complaint_count: 1
    };
    
    // Insertion dans la table de cache
    const { error } = await supabase
      .from('campaign_stats_cache')
      .upsert({
        account_id: account.id,
        campaign_uid: testCampaignUid,
        statistics: testStats as any,
        last_updated: new Date().toISOString()
      }, { 
        onConflict: 'campaign_uid' 
      });
      
    if (error) {
      console.error("Erreur lors du test d'insertion dans le cache:", error);
      return false;
    }
    
    console.log("Test d'insertion dans le cache réussi !");
    return true;
    
  } catch (err) {
    console.error("Exception lors du test d'insertion dans le cache:", err);
    return false;
  }
};

/**
 * Récupère et traite les statistiques d'une campagne
 * avec gestion intelligente du cache
 */
export const fetchAndProcessCampaignStats = async (
  campaign: AcelleCampaign,
  account: AcelleAccount | null,
  options?: {
    refresh?: boolean;
  }
): Promise<{
  statistics: AcelleCampaignStatistics;
  delivery_info: DeliveryInfo;
  lastUpdated?: string;
}> => {
  // Données par défaut
  const emptyStats = createEmptyStatistics();
  const emptyDeliveryInfo = {};
  
  try {
    // Vérifier les identifiants de campagne
    const campaignUid = campaign.uid || campaign.campaign_uid;
    if (!campaignUid) {
      console.error("Impossible de récupérer les statistiques: UID de campagne manquant");
      return { 
        statistics: emptyStats,
        delivery_info: emptyDeliveryInfo
      };
    }
    
    console.log(`Traitement des statistiques pour la campagne ${campaign.name || campaignUid}`);

    if (!options?.refresh) {
      // 1) Vérifier d'abord si nous avons des stats en cache Supabase
      try {
        // Récupération depuis la table de cache des statistiques
        const { data: cachedStats, error } = await supabase
          .from('campaign_stats_cache')
          .select('*')
          .eq('campaign_uid', campaignUid)
          .single();
        
        if (!error && cachedStats) {
          // Vérifier si les données du cache sont encore fraîches
          if (isCacheFresh(cachedStats.last_updated, 24 * 60 * 60 * 1000)) {
            console.log(`Utilisation des statistiques en cache pour ${campaignUid}`);
            return {
              statistics: cachedStats.statistics || emptyStats,
              delivery_info: {},
              lastUpdated: cachedStats.last_updated
            };
          }
          console.log(`Cache obsolète pour ${campaignUid}, rafraîchissement nécessaire`);
        }
      } catch (e) {
        console.warn(`Erreur lors de la récupération du cache pour ${campaignUid}:`, e);
      }
    }
    
    // Si pas de cache frais ou rafraîchissement forcé, utiliser les stats déjà en mémoire
    if (campaign.statistics || campaign.delivery_info) {
      return {
        statistics: campaign.statistics || emptyStats,
        delivery_info: campaign.delivery_info || emptyDeliveryInfo
      };
    }
    
    // Sinon, utiliser les stats par défaut
    return {
      statistics: emptyStats,
      delivery_info: emptyDeliveryInfo
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return {
      statistics: emptyStats,
      delivery_info: emptyDeliveryInfo
    };
  }
};
