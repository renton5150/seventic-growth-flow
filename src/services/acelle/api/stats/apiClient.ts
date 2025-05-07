
import { supabase } from "@/integrations/supabase/client";
import { AcelleCampaignStatistics, AcelleAccount } from "@/types/acelle.types";
import { buildProxyUrl } from "../../acelle-service";
import { ensureValidStatistics } from "./validation";

/**
 * Fetch statistics for a campaign from the Acelle API
 */
export async function fetchCampaignStatisticsFromApi(
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaignStatistics | null> {
  console.log(`[Stats] Appel API pour campagne ${campaignUid}`);
  
  // Vérification des informations du compte
  if (!account || !account.api_token || !account.api_endpoint) {
    console.error('[Stats] Informations de compte incomplètes pour la récupération des stats');
    return null;
  }
  
  // Récupérer les statistiques depuis l'API
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  
  if (!token) {
    console.error("[Stats] Aucun token d'authentification disponible");
    return null;
  }
  
  // IMPORTANT : Utiliser l'endpoint /campaigns/{uid} comme recommandé
  const apiEndpoint = `campaigns/${campaignUid}`;
  
  // Construire l'URL pour les statistiques
  const statsParams = { 
    api_token: account.api_token,
    _t: Date.now().toString()  // Anti-cache
  };
  
  // Créer l'URL pour les statistiques
  const statsUrl = buildProxyUrl(apiEndpoint, statsParams);
  
  console.log(`[Stats] Requête API statistiques: ${statsUrl}`);
  
  // Effectuer l'appel API
  const statsResponse = await fetch(statsUrl, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`[Stats] Réponse API: Status ${statsResponse.status}`);
  
  if (!statsResponse.ok) {
    console.error(`[Stats] Erreur API (${statsResponse.status}): ${statsResponse.statusText}`);
    return null;
  }
  
  // Analyser la réponse
  const responseData = await statsResponse.json();
  
  if (!responseData) {
    console.error('[Stats] Format de réponse API inattendu:', responseData);
    return null;
  }
  
  console.log(`[Stats] Données reçues pour ${campaignUid}:`, responseData);
  
  // Structure de réponse attendue : { campaign: {...}, statistics: {...} }
  const apiStats = responseData.statistics || responseData.data || {};
  
  if (!apiStats || Object.keys(apiStats).length === 0) {
    console.error('[Stats] Aucune statistique trouvée dans la réponse API:', responseData);
    return null;
  }
  
  // Convertir et normaliser les statistiques
  return ensureValidStatistics({
    subscriber_count: apiStats.subscriber_count || 0,
    delivered_count: apiStats.delivered_count || 0,
    delivered_rate: apiStats.delivered_rate || 0,
    open_count: apiStats.open_count || apiStats.uniq_open_count || 0,
    uniq_open_count: apiStats.uniq_open_count || apiStats.open_count || 0,
    uniq_open_rate: apiStats.uniq_open_rate || apiStats.unique_open_rate || 0,
    click_count: apiStats.click_count || 0,
    click_rate: apiStats.click_rate || 0,
    bounce_count: apiStats.bounce_count || 0,
    soft_bounce_count: apiStats.soft_bounce_count || 0,
    hard_bounce_count: apiStats.hard_bounce_count || 0,
    unsubscribe_count: apiStats.unsubscribe_count || 0,
    abuse_complaint_count: apiStats.abuse_complaint_count || 0,
  });
}
