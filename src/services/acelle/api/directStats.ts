
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";

/**
 * Interface pour les options de récupération de statistiques
 */
interface StatsOptions {
  useDirectApi?: boolean;
  useFallback?: boolean;
  demoMode?: boolean;
}

/**
 * Récupère les statistiques d'une campagne Acelle directement depuis l'API
 * 
 * @param campaign La campagne pour laquelle récupérer les statistiques
 * @param account Le compte Acelle contenant les informations de connexion
 * @param options Options de récupération
 * @returns Statistiques de la campagne
 */
export async function getCampaignStatsDirectly(
  campaign: AcelleCampaign, 
  account: AcelleAccount,
  options: StatsOptions = {}
): Promise<Record<string, any>> {
  const { useDirectApi = true, useFallback = true, demoMode = false } = options;
  
  // Si mode démo activé, retourner des statistiques simulées
  if (demoMode) {
    console.log("Mode démo: génération de statistiques simulées");
    return generateSimulatedStats();
  }
  
  try {
    // Vérifier si le compte et la campagne sont valides
    const campaignId = campaign?.uid || campaign?.campaign_uid;
    if (!campaignId || !account?.apiEndpoint || !account?.apiToken) {
      console.warn("Informations de compte ou de campagne incomplètes", { 
        hasUid: !!campaignId, 
        hasEndpoint: !!account?.apiEndpoint,
        hasApiKey: !!account?.apiToken
      });
      
      // Mode dégrédé: utiliser les stats existantes
      return campaign.delivery_info || {};
    }
    
    if (useDirectApi) {
      // Appel direct à l'API Acelle
      console.log(`Récupération directe des stats pour la campagne ${campaignId}`);
      const apiToken = account.apiToken;
      
      const rawStats = await fetchCampaignStats(
        campaignId,
        account.apiEndpoint,
        apiToken
      );
      
      if (rawStats) {
        // Traiter les statistiques brutes
        const processedStats = processRawStats(rawStats);
        console.log("Statistiques traitées:", processedStats);
        
        // Mettre à jour le format pour qu'il soit compatible avec le format d'affichage
        return {
          ...processedStats,
          delivery_info: {
            total: processedStats.subscriber_count || 0,
            delivered: processedStats.delivered_count || 0,
            delivery_rate: processedStats.delivered_rate || 0,
            opened: processedStats.open_count || 0,
            unique_open_rate: processedStats.open_rate || 0,
            clicked: processedStats.click_count || 0,
            click_rate: processedStats.click_rate || 0,
            bounced: {
              total: processedStats.bounce_count || 0
            },
            unsubscribed: processedStats.unsubscribe_count || 0,
            complained: processedStats.complaint_count || 0
          }
        };
      }
    }
    
    // Si l'appel direct échoue et que le mode de repli est activé
    if (useFallback) {
      console.log("Utilisation des stats existantes dans les données de campagne");
      return campaign.delivery_info || campaign.statistics || {};
    }
    
    return {};
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    
    // En cas d'erreur et si le mode de repli est activé
    if (useFallback) {
      return campaign.delivery_info || campaign.statistics || {};
    }
    
    return {};
  }
}

/**
 * Met à jour en masse les statistiques pour un ensemble de campagnes
 * 
 * @param campaigns Liste des campagnes
 * @param account Compte Acelle
 * @param options Options de mise à jour
 * @returns Campagnes mises à jour avec leurs statistiques
 */
export async function enrichCampaignsWithStats(
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options: StatsOptions = {}
): Promise<AcelleCampaign[]> {
  if (!campaigns || campaigns.length === 0 || !account) {
    return campaigns;
  }
  
  // Limiter à 5 campagnes pour éviter trop d'appels API
  const campaignsToEnrich = campaigns.slice(0, 5);
  
  console.log(`Enrichissement de ${campaignsToEnrich.length} campagnes avec statistiques`);
  
  const enrichedCampaigns = await Promise.all(
    campaignsToEnrich.map(async (campaign) => {
      try {
        const stats = await getCampaignStatsDirectly(campaign, account, options);
        
        // Ensure proper typing for statistics
        const typedStats: Partial<AcelleCampaignStatistics> = {
          subscriber_count: stats.subscriber_count || 0,
          delivered_count: stats.delivered_count || 0,
          delivered_rate: stats.delivered_rate || 0,
          open_count: stats.open_count || 0,
          uniq_open_rate: stats.open_rate || stats.uniq_open_rate || 0,
          click_count: stats.click_count || 0,
          click_rate: stats.click_rate || 0,
          bounce_count: stats.bounce_count || 0,
          soft_bounce_count: stats.soft_bounce_count || 0,
          hard_bounce_count: stats.hard_bounce_count || 0,
          unsubscribe_count: stats.unsubscribe_count || 0,
          abuse_complaint_count: stats.complaint_count || stats.abuse_complaint_count || 0
        };
        
        // Create a proper typed campaign object
        return {
          ...campaign,
          delivery_info: stats.delivery_info || stats,
          statistics: typedStats as AcelleCampaignStatistics
        };
      } catch (error) {
        console.error(`Erreur lors de l'enrichissement de la campagne ${campaign.name}:`, error);
        return campaign;
      }
    })
  );
  
  return enrichedCampaigns;
}

// Réutiliser les fonctions existantes du module campaignStatusUtils pour la continuité
import { fetchCampaignStats, processRawStats, generateSimulatedStats } from "@/utils/acelle/campaignStatusUtils";
