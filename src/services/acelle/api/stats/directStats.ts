
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { fetchCampaignStatisticsFromApi, fetchCampaignStatisticsLegacy } from "./apiClient";
import { createEmptyStatistics, extractStatisticsFromAnyFormat } from "@/utils/acelle/campaignStats";

/**
 * Vérifie si les statistiques sont vides ou non initialisées
 * Une campagne est considérée comme ayant des statistiques vides si le nombre
 * de destinataires (subscriber_count) est à zéro et qu'aucun autre champ n'a de valeur
 */
export const hasEmptyStatistics = (statistics?: AcelleCampaignStatistics | null): boolean => {
  if (!statistics) return true;
  
  // Vérifier si toutes les valeurs principales sont nulles ou zéro
  const hasNonZeroValue = 
    statistics.subscriber_count > 0 || 
    statistics.delivered_count > 0 ||
    statistics.open_count > 0 ||
    statistics.click_count > 0 ||
    statistics.bounce_count > 0;
  
  // Si au moins une valeur est non-nulle, les statistiques ne sont pas vides
  return !hasNonZeroValue;
};

/**
 * Enrichit les campagnes avec des statistiques en utilisant uniquement l'API directe
 * Version simplifiée et robuste qui tente d'abord la méthode directe puis la méthode legacy
 */
export const enrichCampaignsWithStats = async (
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  options?: {
    forceRefresh?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  if (!campaigns.length) return campaigns;
  
  const enrichedCampaigns: AcelleCampaign[] = [];
  
  for (const campaign of campaigns) {
    try {
      const campaignUid = campaign.uid || campaign.campaign_uid || '';
      if (!campaignUid) {
        console.error("Campaign is missing UID:", campaign);
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      // Si les statistiques semblent déjà complètes et qu'on ne force pas le rafraîchissement, on saute
      if (!options?.forceRefresh && 
          campaign.statistics && 
          !hasEmptyStatistics(campaign.statistics)) {
        console.log(`Statistiques déjà disponibles pour la campagne ${campaign.name}, aucun enrichissement nécessaire`);
        enrichedCampaigns.push(campaign);
        continue;
      }
      
      console.log(`Récupération des statistiques depuis l'API pour la campagne ${campaignUid}`);
      
      // Tenter d'abord la nouvelle méthode directe
      let statistics = await fetchCampaignStatisticsFromApi(campaignUid, account);
      
      // Si échec avec la nouvelle méthode, essayer la méthode legacy
      if (!statistics || hasEmptyStatistics(statistics)) {
        console.log(`Tentative de récupération via méthode legacy pour la campagne ${campaignUid}`);
        statistics = await fetchCampaignStatisticsLegacy(campaignUid, account);
      }
      
      // Valider et normaliser les statistiques récupérées
      const validatedStats = statistics ? ensureValidStatistics(statistics) : null;
      
      // Vérifier si les statistiques ont été récupérées avec succès
      if (validatedStats && !hasEmptyStatistics(validatedStats)) {
        console.log(`Statistiques récupérées avec succès pour la campagne ${campaignUid}:`, validatedStats);
      } else {
        console.warn(`Aucune statistique valide récupérée pour la campagne ${campaignUid}`);
      }
      
      // Ajouter les statistiques à la campagne
      const enrichedCampaign = {
        ...campaign,
        statistics: validatedStats || campaign.statistics || createEmptyStatistics()
      };
      
      // Ajouter des informations sur la source de données à la meta
      if (enrichedCampaign.meta) {
        enrichedCampaign.meta = {
          ...enrichedCampaign.meta,
          data_source: validatedStats ? 'api_direct' : 'cache',
          last_refresh: new Date().toISOString()
        };
      } else {
        enrichedCampaign.meta = {
          data_source: validatedStats ? 'api_direct' : 'cache',
          last_refresh: new Date().toISOString()
        };
      }
      
      enrichedCampaigns.push(enrichedCampaign);
      
    } catch (error) {
      console.error(`Error enriching campaign ${campaign.uid || campaign.name} with stats:`, error);
      // Inclure quand même la campagne sans statistiques
      enrichedCampaigns.push(campaign);
    }
  }
  
  return enrichedCampaigns;
};

/**
 * Récupère les statistiques directement, en essayant d'abord la méthode directe puis la méthode legacy
 */
export const fetchDirectStatistics = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`Tentative de récupération directe des statistiques pour ${campaignUid}`);
    
    // Tenter d'abord la méthode directe
    let stats = await fetchCampaignStatisticsFromApi(campaignUid, account);
    
    if (!stats || hasEmptyStatistics(stats)) {
      console.log(`Échec ou statistiques vides avec la méthode directe, tentative via legacy pour ${campaignUid}`);
      stats = await fetchCampaignStatisticsLegacy(campaignUid, account);
    }
    
    // Essai de la méthode stats v2 si les deux premières ont échoué
    if (!stats || hasEmptyStatistics(stats)) {
      console.log(`Méthodes principales échouées, tentative via API stats pour ${campaignUid}`);
      try {
        const apiUrl = `${account.api_endpoint}/api/v1/campaigns/${campaignUid}/stats?api_token=${account.api_token}`;
        const response = await fetch(apiUrl, {
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          const statsData = data.stats || data.data || data;
          if (statsData) {
            stats = extractStatisticsFromAnyFormat(statsData);
          }
        }
      } catch (e) {
        console.error("Erreur lors de la récupération des statistiques via API stats:", e);
      }
    }
    
    // S'assurer que les statistiques sont valides et normalisées
    if (stats) {
      const validatedStats = ensureValidStatistics(stats);
      console.log(`Statistiques récupérées avec succès pour ${campaignUid}`, validatedStats);
      return validatedStats;
    } else {
      console.error(`Aucune statistique valide n'a pu être récupérée pour ${campaignUid}`);
      return createEmptyStatistics();
    }
  } catch (error) {
    console.error(`Error fetching direct statistics for campaign ${campaignUid}:`, error);
    return createEmptyStatistics();
  }
};
