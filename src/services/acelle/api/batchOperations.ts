
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

    console.log("Campagnes récupérées:", cachedCampaigns?.length);
    
    // Convertir les données en objets AcelleCampaign
    const campaigns: AcelleCampaign[] = cachedCampaigns.map(c => {
      // Log pour débugger la structure de l'objet delivery_info
      console.log(`Traitement de la campagne ${c.campaign_uid}, delivery_info:`, c.delivery_info);
      
      // Créer un objet DeliveryInfo en gérant les différents formats possibles
      let deliveryInfo: DeliveryInfo | null = null;
      
      if (c.delivery_info) {
        try {
          // Normaliser l'objet delivery_info (peut être une chaîne JSON ou un objet)
          const rawInfo = typeof c.delivery_info === 'string' 
            ? JSON.parse(c.delivery_info) 
            : c.delivery_info;
          
          console.log("rawInfo après normalisation:", rawInfo);
          
          // Traiter le champ 'bounced' qui peut avoir différentes structures
          let bounced: any = rawInfo.bounced;
          let bouncedTotal = 0;
          let bouncedSoft = 0;
          let bouncedHard = 0;
          
          if (bounced !== undefined && bounced !== null) {
            if (typeof bounced === 'object') {
              // Si c'est un objet avec des propriétés total/soft/hard
              bouncedTotal = Number(bounced.total) || 0;
              bouncedSoft = Number(bounced.soft) || 0;
              bouncedHard = Number(bounced.hard) || 0;
            } else {
              // Si c'est directement un nombre
              bouncedTotal = Number(bounced) || 0;
            }
          }
          
          // Construire l'objet deliveryInfo avec conversion explicite de chaque valeur
          deliveryInfo = {
            total: Number(rawInfo.total) || 0,
            delivery_rate: Number(rawInfo.delivery_rate) || 0,
            unique_open_rate: Number(rawInfo.unique_open_rate) || 0,
            click_rate: Number(rawInfo.click_rate) || 0,
            bounce_rate: Number(rawInfo.bounce_rate) || 0,
            unsubscribe_rate: Number(rawInfo.unsubscribe_rate) || 0,
            delivered: Number(rawInfo.delivered) || 0,
            opened: Number(rawInfo.opened) || 0,
            clicked: Number(rawInfo.clicked) || 0,
            bounced: typeof bounced === 'object' 
              ? {
                  total: bouncedTotal,
                  soft: bouncedSoft,
                  hard: bouncedHard
                } 
              : bouncedTotal,
            unsubscribed: Number(rawInfo.unsubscribed) || 0,
            complained: Number(rawInfo.complained) || 0
          };
          
          console.log("DeliveryInfo formatté:", deliveryInfo);
        } catch (error) {
          console.error("Erreur lors du traitement de delivery_info:", error);
          // En cas d'erreur, créer un objet DeliveryInfo vide
          deliveryInfo = {
            total: 0,
            delivery_rate: 0,
            unique_open_rate: 0,
            click_rate: 0,
            bounce_rate: 0,
            unsubscribe_rate: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0,
            complained: 0
          };
        }
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
        delivery_info: deliveryInfo as DeliveryInfo
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
