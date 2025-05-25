
import { AcelleAccount, AcelleCampaignStatistics } from "@/types/acelle.types";
import { ensureValidStatistics } from "./validation";
import { callViaEdgeFunction, callDirectAcelleApi, buildCleanAcelleApiUrl } from "../../acelle-service";
import { extractStatisticsFromAnyFormat } from "@/utils/acelle/campaignStats";

/**
 * Récupère les statistiques d'une campagne en priorisant les edge functions
 */
export const fetchCampaignStatisticsFromApi = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  try {
    console.log(`[fetchCampaignStatisticsFromApi] Début pour campagne ${campaignUid}`);
    
    if (!campaignUid || !account || !account.api_token || !account.api_endpoint) {
      console.error("[fetchCampaignStatisticsFromApi] Paramètres manquants");
      return null;
    }
    
    // Méthode 1: Via edge function (recommandée)
    try {
      console.log(`[fetchCampaignStatisticsFromApi] Tentative via edge function`);
      
      const edgeResult = await callViaEdgeFunction(campaignUid, account.id, true);
      
      if (edgeResult && edgeResult.success && edgeResult.stats) {
        console.log(`[fetchCampaignStatisticsFromApi] Edge function OK pour ${campaignUid}`);
        return ensureValidStatistics(edgeResult.stats);
      }
    } catch (edgeError) {
      console.warn(`[fetchCampaignStatisticsFromApi] Edge function échouée pour ${campaignUid}:`, edgeError);
    }
    
    // Méthode 2: Appel direct (fallback)
    try {
      console.log(`[fetchCampaignStatisticsFromApi] Fallback vers appel direct`);
      
      const apiUrl = buildCleanAcelleApiUrl(
        `campaigns/${campaignUid}/statistics`,
        account.api_endpoint,
        { api_token: account.api_token }
      );
      
      const data = await callDirectAcelleApi(apiUrl, { timeout: 8000 });
      
      if (data) {
        console.log(`[fetchCampaignStatisticsFromApi] Appel direct OK pour ${campaignUid}`);
        const stats = extractStatisticsFromAnyFormat(data);
        return ensureValidStatistics(stats);
      }
    } catch (directError) {
      console.error(`[fetchCampaignStatisticsFromApi] Appel direct échoué pour ${campaignUid}:`, directError);
    }
    
    // Méthode 3: Route alternative (dernier recours)
    try {
      console.log(`[fetchCampaignStatisticsFromApi] Tentative route alternative`);
      
      const altUrl = buildCleanAcelleApiUrl(
        `campaigns/${campaignUid}`,
        account.api_endpoint,
        { api_token: account.api_token }
      );
      
      const data = await callDirectAcelleApi(altUrl, { timeout: 8000 });
      
      if (data && (data.campaign || data.statistics)) {
        console.log(`[fetchCampaignStatisticsFromApi] Route alternative OK pour ${campaignUid}`);
        const stats = extractStatisticsFromAnyFormat(data);
        return ensureValidStatistics(stats);
      }
    } catch (altError) {
      console.error(`[fetchCampaignStatisticsFromApi] Route alternative échouée pour ${campaignUid}:`, altError);
    }
    
    console.error(`[fetchCampaignStatisticsFromApi] Toutes les méthodes ont échoué pour ${campaignUid}`);
    return null;
  } catch (error) {
    console.error(`[fetchCampaignStatisticsFromApi] Erreur générale pour ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Méthode legacy maintenue pour compatibilité
 */
export const fetchCampaignStatisticsLegacy = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> => {
  console.log(`[fetchCampaignStatisticsLegacy] Redirection vers méthode principale pour ${campaignUid}`);
  return fetchCampaignStatisticsFromApi(campaignUid, account);
};
