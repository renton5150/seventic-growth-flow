
import { AcelleAccount, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { updateCampaignStatsCache } from "./campaignStats";

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
    
    // Créer des statistiques standardisées avec des valeurs par défaut sûres
    const rawStats = proxyResponse.data.statistics || {};
    
    // Créer un objet statistiques standard avec des valeurs par défaut
    const statistics: AcelleCampaignStatistics = {
      subscriber_count: Number(rawStats.subscriber_count) || 0,
      delivered_count: Number(rawStats.delivered_count) || 0,
      delivered_rate: Number(rawStats.delivered_rate) || 0,
      open_count: Number(rawStats.open_count) || 0,
      uniq_open_count: Number(rawStats.uniq_open_count || rawStats.unique_opens) || 0,
      uniq_open_rate: Number(rawStats.uniq_open_rate || rawStats.unique_open_rate) || 0,
      click_count: Number(rawStats.click_count) || 0,
      click_rate: Number(rawStats.click_rate) || 0,
      bounce_count: Number(rawStats.bounce_count) || 0,
      soft_bounce_count: Number(rawStats.soft_bounce_count) || 0,
      hard_bounce_count: Number(rawStats.hard_bounce_count) || 0,
      unsubscribe_count: Number(rawStats.unsubscribe_count) || 0,
      abuse_complaint_count: Number(rawStats.abuse_complaint_count || rawStats.complaint_count) || 0
    };
    
    // Création d'un objet delivery_info standardisé à partir des statistiques
    const delivery_info: DeliveryInfo = {
      total: statistics.subscriber_count,
      delivery_rate: statistics.delivered_rate,
      unique_open_rate: statistics.uniq_open_rate,
      click_rate: statistics.click_rate,
      bounce_rate: statistics.bounce_count ? statistics.bounce_count / (statistics.subscriber_count || 1) : 0,
      unsubscribe_rate: statistics.unsubscribe_count ? statistics.unsubscribe_count / (statistics.subscriber_count || 1) : 0,
      delivered: statistics.delivered_count,
      opened: statistics.open_count,
      clicked: statistics.click_count,
      bounced: {
        total: statistics.bounce_count,
        soft: statistics.soft_bounce_count,
        hard: statistics.hard_bounce_count
      },
      unsubscribed: statistics.unsubscribe_count,
      complained: statistics.abuse_complaint_count
    };
    
    console.log(`Statistiques récupérées pour ${campaignUid}:`, statistics);
    console.log(`Infos de livraison pour ${campaignUid}:`, delivery_info);
    
    // Mise à jour du cache pour cette campagne
    await updateCampaignStatsCache(campaignUid, account.id, statistics, delivery_info);
    
    return { statistics, delivery_info };
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour la campagne ${campaignUid}:`, error);
    
    // En cas d'erreur, retourner des statistiques vides mais bien formatées
    const emptyStats: AcelleCampaignStatistics = {
      subscriber_count: 0,
      delivered_count: 0,
      delivered_rate: 0,
      open_count: 0,
      uniq_open_count: 0,
      uniq_open_rate: 0,
      click_count: 0,
      click_rate: 0,
      bounce_count: 0,
      soft_bounce_count: 0,
      hard_bounce_count: 0,
      unsubscribe_count: 0,
      abuse_complaint_count: 0
    };
    
    const emptyDelivery: DeliveryInfo = {
      total: 0,
      delivery_rate: 0,
      unique_open_rate: 0,
      click_rate: 0,
      bounce_rate: 0,
      unsubscribe_rate: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: { total: 0, soft: 0, hard: 0 },
      unsubscribed: 0,
      complained: 0
    };
    
    throw error;
  }
}
