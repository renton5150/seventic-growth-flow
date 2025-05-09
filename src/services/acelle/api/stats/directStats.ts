
import { AcelleCampaign, AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildApiPath } from "@/utils/acelle/proxyUtils";
import { ensureValidStatistics } from "./validation";
import { getCachedStatistics, saveCampaignStatistics } from "./cacheManager";

/**
 * Enrichit les campagnes avec des statistiques directement depuis l'API Acelle
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[], 
  account: AcelleAccount,
  options?: { 
    forceRefresh?: boolean;
    bypassCache?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  console.log(`Enrichissement de ${campaigns.length} campagnes avec des statistiques...`, {
    forceRefresh: options?.forceRefresh,
    bypassCache: options?.bypassCache
  });
  
  // Vérification des informations du compte
  if (!account || !account.api_token || !account.api_endpoint) {
    console.error("Impossible d'enrichir les campagnes: informations de compte incomplètes");
    return campaigns;
  }
  
  const enrichedCampaigns = [...campaigns];
  const shouldUseCache = !options?.bypassCache;
  
  // Vérifie si la synchronisation manuelle est nécessaire
  try {
    // Appeler la fonction de synchronisation manuelle seulement si on force le rafraîchissement
    if (options?.forceRefresh) {
      console.log("Forçage de la synchronisation manuelle des statistiques...");
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (accessToken) {
        const { data, error } = await supabase.rpc('sync_campaign_statistics_manually', {
          account_id_param: account.id
        });
        
        if (error) {
          console.error("Erreur lors de la synchronisation manuelle:", error);
        } else {
          console.log("Résultat de la synchronisation manuelle:", data);
        }
      }
    }
  } catch (syncError) {
    console.error("Erreur lors de l'appel à sync_campaign_statistics_manually:", syncError);
  }
  
  // Pour chaque campagne, récupérer les statistiques
  for (let i = 0; i < enrichedCampaigns.length; i++) {
    try {
      const campaign = enrichedCampaigns[i];
      const campaignId = campaign.uid || campaign.campaign_uid;
      
      if (!campaignId) {
        console.error("Impossible d'enrichir: identifiant de campagne manquant");
        continue;
      }
      
      // Tenter d'abord de récupérer depuis le cache, sauf si bypassCache est demandé
      let statistics: AcelleCampaignStatistics | null = null;
      
      if (shouldUseCache && !options?.forceRefresh) {
        statistics = await getCachedStatistics(campaignId, account.id);
        
        if (statistics && !hasEmptyStatistics(statistics)) {
          console.log(`Statistiques récupérées depuis le cache pour ${campaignId}`);
          enrichedCampaigns[i] = {
            ...campaign,
            statistics,
            delivery_info: statistics // Mise à jour également de delivery_info
          };
          continue; // Passer à la campagne suivante
        }
      }
      
      // Si pas dans le cache ou le cache est contourné, récupérer depuis l'API
      const apiUrl = buildApiPath(
        account.api_endpoint,
        `campaigns/${campaignId}/statistics`
      );
      
      console.log(`Récupération des statistiques depuis l'API pour ${campaignId}`);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.error("Token d'authentification non disponible pour l'appel API");
        continue;
      }
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Acelle-Token': account.api_token,
          'X-Acelle-Endpoint': account.api_endpoint
        }
      });
      
      if (!response.ok) {
        throw new Error(`Échec de la récupération des statistiques: ${response.status} ${response.statusText}`);
      }
      
      const statsData = await response.json();
      statistics = ensureValidStatistics(statsData);
      
      // Stocke dans le cache pour utilisation future
      await saveCampaignStatistics(campaignId, account.id, statistics);
      
      // Met à jour la campagne avec les statistiques récupérées
      enrichedCampaigns[i] = {
        ...campaign,
        statistics,
        delivery_info: statistics // Mise à jour également de delivery_info
      };
      
      console.log(`Statistiques appliquées pour la campagne ${campaignId}:`, {
        uniq_open_rate: statistics.uniq_open_rate,
        click_rate: statistics.click_rate
      });
    } catch (error) {
      console.error(`Erreur lors de l'enrichissement de la campagne ${enrichedCampaigns[i].name}:`, error);
    }
  }
  
  return enrichedCampaigns;
};

/**
 * Vérifie si les statistiques sont vides ou nulles
 */
export const hasEmptyStatistics = (statistics: any): boolean => {
  if (!statistics) return true;
  
  // Vérifier les champs clés pour déterminer si les stats sont vides
  const hasSubscribers = statistics.subscriber_count && statistics.subscriber_count > 0;
  const hasOpenRate = statistics.uniq_open_rate && statistics.uniq_open_rate > 0;
  const hasClickRate = statistics.click_rate && statistics.click_rate > 0;
  
  return !hasSubscribers && !hasOpenRate && !hasClickRate;
};
