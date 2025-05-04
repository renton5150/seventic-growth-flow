
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { getBulkCachedStats, hasValidStatistics } from "./statsCache";
import { getSmartCampaignStats } from "./singleCampaignStats";
import { supabase } from "@/integrations/supabase/client";

interface SmartStatsOptions {
  forceRefresh?: boolean;
  timeout?: number;
  quietMode?: boolean;
}

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
