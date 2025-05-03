
import { AcelleAccount, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { formatCampaignStatistics, updateCampaignStatsCache } from "./campaignStats";

/**
 * Récupère directement les statistiques d'une campagne depuis l'API Acelle
 * en contournant le mécanisme de cache pour obtenir des données fraîches
 */
export async function fetchDirectCampaignStats(
  campaignUid: string, 
  account: AcelleAccount,
  token: string
): Promise<{statistics: AcelleCampaignStatistics, delivery_info: DeliveryInfo}> {
  try {
    console.log(`Récupération des statistiques pour la campagne ${campaignUid}...`);
    
    // Construction de l'URL pour le proxy CORS de Supabase
    const proxyEndpoint = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy';
    
    // Construction de l'URL cible d'Acelle
    const apiEndpoint = account.apiEndpoint.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
    
    const targetUrl = `${apiEndpoint}/api/v1/campaigns/${campaignUid}/statistics`;
    
    console.log(`URL de l'API cible: ${targetUrl}`);
    
    // Appel au proxy CORS avec authentification
    const response = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: targetUrl,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${account.apiToken}`
        }
      })
    });

    // Vérification de la réponse du proxy
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur de proxy CORS (${response.status}):`, errorText);
      throw new Error(`Erreur de proxy (${response.status}): ${errorText}`);
    }
    
    // Parsing de la réponse JSON
    const proxyResponse = await response.json();
    
    // Vérification de la réponse de l'API Acelle
    if (!proxyResponse.success) {
      console.error("Erreur API Acelle:", proxyResponse);
      throw new Error(`Erreur API: ${proxyResponse.message || 'Erreur inconnue'}`);
    }
    
    console.log(`Données reçues pour la campagne ${campaignUid}:`, proxyResponse.data);
    
    // Extraction et formatage des statistiques de campagne
    const statistics = formatCampaignStatistics(proxyResponse.data.statistics);
    
    // Création d'un objet delivery_info à partir des statistiques
    const delivery_info = {
      total: statistics.subscriber_count || 0,
      delivery_rate: statistics.delivered_rate || 0,
      unique_open_rate: statistics.uniq_open_rate || 0,
      click_rate: statistics.click_rate || 0,
      bounce_rate: statistics.bounce_count ? statistics.bounce_count / (statistics.subscriber_count || 1) : 0,
      unsubscribe_rate: statistics.unsubscribe_count ? statistics.unsubscribe_count / (statistics.subscriber_count || 1) : 0,
      delivered: statistics.delivered_count || 0,
      opened: statistics.open_count || 0,
      clicked: statistics.click_count || 0,
      bounced: {
        total: statistics.bounce_count || 0,
        soft: statistics.soft_bounce_count || 0,
        hard: statistics.hard_bounce_count || 0
      },
      unsubscribed: statistics.unsubscribe_count || 0,
      complained: statistics.abuse_complaint_count || 0
    };
    
    console.log(`Statistiques formatées pour ${campaignUid}:`, statistics);
    console.log(`Infos de livraison pour ${campaignUid}:`, delivery_info);
    
    // Mise à jour du cache pour cette campagne
    await updateCampaignStatsCache(campaignUid, account.id, statistics, delivery_info);
    
    return { statistics, delivery_info };
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour la campagne ${campaignUid}:`, error);
    throw error;
  }
}
