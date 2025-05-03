
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { toast } from "sonner";
import { fetchDirectCampaignStats } from "./directCampaignFetch";
import { supabase } from "@/integrations/supabase/client";

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
      // en utilisant une vérification de type et des valeurs par défaut sécurisées
      let deliveryInfo: DeliveryInfo | undefined = undefined;
      
      if (c.delivery_info) {
        // Traiter l'objet delivery_info comme un Record<string, any> pour l'extraction des données
        const deliveryData = c.delivery_info as Record<string, any>;
        
        deliveryInfo = {
          total: typeof deliveryData.total === 'number' ? deliveryData.total : 0,
          delivery_rate: typeof deliveryData.delivery_rate === 'number' ? deliveryData.delivery_rate : 0,
          unique_open_rate: typeof deliveryData.unique_open_rate === 'number' ? deliveryData.unique_open_rate : 0,
          click_rate: typeof deliveryData.click_rate === 'number' ? deliveryData.click_rate : 0,
          bounce_rate: typeof deliveryData.bounce_rate === 'number' ? deliveryData.bounce_rate : 0,
          unsubscribe_rate: typeof deliveryData.unsubscribe_rate === 'number' ? deliveryData.unsubscribe_rate : 0,
          delivered: typeof deliveryData.delivered === 'number' ? deliveryData.delivered : 0,
          opened: typeof deliveryData.opened === 'number' ? deliveryData.opened : 0,
          clicked: typeof deliveryData.clicked === 'number' ? deliveryData.clicked : 0,
          bounced: typeof deliveryData.bounced === 'number' ? deliveryData.bounced : 0,
          unsubscribed: typeof deliveryData.unsubscribed === 'number' ? deliveryData.unsubscribed : 0,
          complained: typeof deliveryData.complained === 'number' ? deliveryData.complained : 0
        };
      }

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
