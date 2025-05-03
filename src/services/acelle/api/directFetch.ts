
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    // Construction de l'URL pour le proxy CORS de Supabase
    const proxyEndpoint = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy';
    
    // Construction de l'URL cible d'Acelle
    const apiEndpoint = account.apiEndpoint.endsWith('/') 
      ? account.apiEndpoint.slice(0, -1) 
      : account.apiEndpoint;
    
    const targetUrl = `${apiEndpoint}/api/v1/campaigns/${campaignUid}/statistics`;
    
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
      bounced: statistics.bounce_count || 0,
      unsubscribed: statistics.unsubscribe_count || 0,
      complained: statistics.abuse_complaint_count || 0
    };
    
    // Mise à jour du cache pour cette campagne
    await updateCampaignStatsCache(campaignUid, account.id, statistics, delivery_info);
    
    return { statistics, delivery_info };
  } catch (error) {
    console.error(`Erreur lors de la récupération des statistiques pour la campagne ${campaignUid}:`, error);
    throw error;
  }
}

/**
 * Met à jour le cache des statistiques de campagne dans Supabase
 */
async function updateCampaignStatsCache(
  campaignUid: string, 
  accountId: string, 
  statistics: AcelleCampaignStatistics, 
  delivery_info: DeliveryInfo
) {
  try {
    // Rechercher la campagne dans le cache
    const { data: existingCampaign } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId)
      .single();
      
    if (!existingCampaign) {
      console.warn(`Campagne ${campaignUid} non trouvée dans le cache, impossible de mettre à jour les stats`);
      return;
    }
    
    // Mise à jour des statistiques de la campagne dans le cache
    // Conversion de delivery_info en objet simple pour éviter les erreurs de typage JSON
    const deliveryInfoJson = {
      total: delivery_info.total || 0,
      delivery_rate: delivery_info.delivery_rate || 0,
      unique_open_rate: delivery_info.unique_open_rate || 0,
      click_rate: delivery_info.click_rate || 0,
      bounce_rate: delivery_info.bounce_rate || 0,
      unsubscribe_rate: delivery_info.unsubscribe_rate || 0,
      delivered: delivery_info.delivered || 0,
      opened: delivery_info.opened || 0,
      clicked: delivery_info.clicked || 0,
      bounced: delivery_info.bounced || 0,
      unsubscribed: delivery_info.unsubscribed || 0,
      complained: delivery_info.complained || 0
    };
    
    const { error } = await supabase
      .from('email_campaigns_cache')
      .update({
        delivery_info: deliveryInfoJson,
        cache_updated_at: new Date().toISOString()
      })
      .eq('campaign_uid', campaignUid)
      .eq('account_id', accountId);
      
    if (error) {
      console.error("Erreur lors de la mise à jour du cache:", error);
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du cache de statistiques:", error);
  }
}

/**
 * Formatte les statistiques brutes de l'API en un format standardisé
 */
function formatCampaignStatistics(rawStats: any): AcelleCampaignStatistics {
  return {
    subscriber_count: rawStats.subscriber_count || 0,
    delivered_count: rawStats.delivered_count || 0,
    delivered_rate: rawStats.delivered_rate || 0,
    open_count: rawStats.open_count || 0,
    uniq_open_count: rawStats.unique_opens_count || rawStats.uniq_open_count || 0,
    uniq_open_rate: rawStats.unique_open_rate || rawStats.uniq_open_rate || 0,
    click_count: rawStats.click_count || 0,
    click_rate: rawStats.click_rate || 0,
    bounce_count: rawStats.bounce_count || rawStats.bounces_count || 0,
    soft_bounce_count: rawStats.soft_bounce_count || 0,
    hard_bounce_count: rawStats.hard_bounce_count || 0,
    unsubscribe_count: rawStats.unsubscribe_count || 0,
    abuse_complaint_count: rawStats.abuse_complaint_count || rawStats.complaint_count || 0
  };
}

/**
 * Rafraîchit les statistiques d'un lot de campagnes en parallèle
 */
export async function refreshCampaignStatsBatch(
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  token: string
): Promise<Map<string, AcelleCampaignStatistics>> {
  const statsMap = new Map<string, AcelleCampaignStatistics>();
  const promises: Promise<void>[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Création d'une promesse pour chaque campagne
  for (const campaign of campaigns) {
    const campaignUid = campaign.uid || campaign.campaign_uid;
    if (!campaignUid) {
      console.warn("Campaign without UID detected, skipping", campaign);
      continue;
    }

    const promise = fetchDirectCampaignStats(campaignUid, account, token)
      .then(result => {
        // Stocker les statistiques dans la map
        statsMap.set(campaignUid, result.statistics);
        
        // Mettre à jour la campagne avec les nouvelles statistiques
        campaign.statistics = result.statistics;
        campaign.delivery_info = result.delivery_info;
        
        successCount++;
      })
      .catch(error => {
        console.error(`Erreur pour la campagne ${campaignUid}:`, error);
        errorCount++;
      });

    promises.push(promise);
  }

  // Attendre que toutes les promesses soient résolues
  await Promise.all(promises);

  // Afficher un toast avec le résumé
  if (successCount > 0) {
    toast.success(`Statistiques rafraîchies pour ${successCount} campagne(s)`);
  }
  
  if (errorCount > 0) {
    toast.error(`Échec pour ${errorCount} campagne(s)`);
  }

  return statsMap;
}

/**
 * Rafraîchit toutes les statistiques pour toutes les campagnes d'un compte
 */
export async function refreshAllCampaignStats(
  account: AcelleAccount,
  token: string
): Promise<boolean> {
  try {
    toast.loading("Synchronisation des statistiques...", {
      id: "stats-sync"
    });

    // Récupérer toutes les campagnes en cache pour ce compte
    const { data: cachedCampaigns, error: fetchError } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', account.id);

    if (fetchError) {
      console.error("Erreur lors de la récupération des campagnes en cache:", fetchError);
      toast.error("Erreur lors de la synchronisation des statistiques", {
        id: "stats-sync"
      });
      return false;
    }

    // Convertir les données en objets AcelleCampaign
    const campaigns: AcelleCampaign[] = cachedCampaigns.map(c => {
      // Convertir explicitement le delivery_info en type DeliveryInfo 
      const deliveryInfo: DeliveryInfo = c.delivery_info ? {
        total: c.delivery_info.total || 0,
        delivery_rate: c.delivery_info.delivery_rate || 0,
        unique_open_rate: c.delivery_info.unique_open_rate || 0,
        click_rate: c.delivery_info.click_rate || 0,
        bounce_rate: c.delivery_info.bounce_rate || 0,
        unsubscribe_rate: c.delivery_info.unsubscribe_rate || 0,
        delivered: c.delivery_info.delivered || 0,
        opened: c.delivery_info.opened || 0,
        clicked: c.delivery_info.clicked || 0,
        bounced: c.delivery_info.bounced || 0,
        unsubscribed: c.delivery_info.unsubscribed || 0,
        complained: c.delivery_info.complained || 0
      } : undefined;

      return {
        uid: c.campaign_uid,
        campaign_uid: c.campaign_uid,
        name: c.name,
        subject: c.subject,
        status: c.status,
        created_at: c.created_at,
        updated_at: c.updated_at,
        delivery_date: c.delivery_date,
        run_at: c.run_at,
        last_error: c.last_error,
        delivery_info: deliveryInfo
      };
    });

    // Rafraîchir les statistiques par lots
    const batchSize = 5; // Limiter le nombre de requêtes parallèles
    for (let i = 0; i < campaigns.length; i += batchSize) {
      const batch = campaigns.slice(i, i + batchSize);
      await refreshCampaignStatsBatch(batch, account, token);
    }

    toast.success("Synchronisation des statistiques terminée", {
      id: "stats-sync"
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la synchronisation des statistiques:", error);
    
    toast.error("Erreur lors de la synchronisation des statistiques", {
      id: "stats-sync"
    });
    
    return false;
  }
}
