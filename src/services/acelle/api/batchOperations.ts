
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

    console.log(`Récupération de ${cachedCampaigns?.length || 0} campagnes pour synchronisation`);
    
    if (!cachedCampaigns || cachedCampaigns.length === 0) {
      toast.error("Aucune campagne trouvée dans le cache", {
        id: "stats-sync"
      });
      return false;
    }
    
    // Convertir les données en objets AcelleCampaign
    const campaigns: AcelleCampaign[] = cachedCampaigns.map(c => {
      // Créer un simple objet de campagne avec les données nécessaires
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
        last_error: c.last_error
      };
    });

    console.log(`${campaigns.length} campagnes préparées pour synchronisation`);

    // Rafraîchir les statistiques par lots
    const batchSize = 5; // Limiter le nombre de requêtes parallèles
    for (let i = 0; i < campaigns.length; i += batchSize) {
      const batch = campaigns.slice(i, i + batchSize);
      await refreshCampaignStatsBatch(batch, account, token);
      console.log(`Lot ${Math.floor(i/batchSize) + 1} traité: ${batch.length} campagnes`);
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
