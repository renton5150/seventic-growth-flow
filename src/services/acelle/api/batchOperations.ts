
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { enrichCampaignsWithStats } from "./directStats";

/**
 * Rafraîchit les statistiques d'un lot de campagnes
 * Version améliorée qui utilise uniquement des statistiques réelles
 */
export async function refreshCampaignStatsBatch(
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  token: string
): Promise<Map<string, AcelleCampaignStatistics>> {
  const statsMap = new Map<string, AcelleCampaignStatistics>();
  let successCount = 0;
  let errorCount = 0;
  let realStatsCount = 0;

  // Vérifier les paramètres
  if (!campaigns || campaigns.length === 0) {
    console.log("Aucune campagne fournie pour le rafraîchissement");
    return statsMap;
  }
  
  if (!account || !account.id) {
    console.error("Compte Acelle invalide", account);
    throw new Error("Compte Acelle invalide ou incomplet");
  }
  
  console.log(`Rafraîchissement des statistiques pour ${campaigns.length} campagnes...`);

  try {
    // Créer une copie de sauvegarde des campagnes originales et de leurs statistiques
    const originalStats = new Map<string, AcelleCampaignStatistics | undefined>();
    
    campaigns.forEach(campaign => {
      const campaignUid = campaign.uid || campaign.campaign_uid;
      if (!campaignUid) return;
      
      // Sauvegarder les statistiques réelles uniquement
      if (campaign.statistics && campaign.statistics.is_simulated !== true) {
        console.log(`Sauvegarde des statistiques réelles pour ${campaign.name} (${campaignUid})`);
        originalStats.set(campaignUid, { ...campaign.statistics });
      }
    });
    
    // Appliquer l'enrichissement intelligent qui utilise uniquement des statistiques réelles
    const enrichedCampaigns = await enrichCampaignsWithStats(campaigns, account, token);
    
    // Extraire les statistiques dans la map
    enrichedCampaigns.forEach(campaign => {
      const campaignUid = campaign.uid || campaign.campaign_uid;
      if (!campaignUid) return;
      
      if (campaign.statistics) {
        realStatsCount++;
        console.log(`Statistiques réelles préservées pour ${campaign.name} (${campaignUid})`);
        statsMap.set(campaignUid, campaign.statistics);
        successCount++;
      } else {
        console.log(`Aucune statistique réelle trouvée pour ${campaign.name} (${campaignUid})`);
      }
    });
    
    console.log(`Statistiques traitées: ${successCount} campagnes (toutes avec données réelles)`);
    
    if (successCount > 0) {
      toast.success(`Statistiques traitées pour ${successCount} campagne(s) avec données réelles`);
    } else {
      toast.info("Aucune statistique réelle disponible");
    }
    
    return statsMap;
  } catch (error) {
    console.error("Erreur lors du rafraîchissement des statistiques:", error);
    toast.error(`Échec du rafraîchissement des statistiques: ${error instanceof Error ? error.message : String(error)}`);
    return statsMap;
  }
}

/**
 * Rafraîchit toutes les statistiques pour toutes les campagnes d'un compte
 * Version améliorée qui utilise uniquement des statistiques réelles
 */
export async function refreshAllCampaignStats(
  account: AcelleAccount,
  token: string
): Promise<boolean> {
  try {
    toast.loading("Synchronisation des statistiques...", {
      id: "stats-sync"
    });

    // Vérifier les paramètres
    if (!account || !account.id) {
      console.error("Compte Acelle invalide", account);
      toast.error("Compte Acelle invalide", { id: "stats-sync" });
      return false;
    }

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
    
    // Convertir les données en objets AcelleCampaign tout en préservant les statistiques réelles existantes
    const campaigns: AcelleCampaign[] = cachedCampaigns.map(c => {
      // Convertir les delivery_info de JSON à objet si nécessaire
      let deliveryInfo: any = c.delivery_info;
      
      if (typeof deliveryInfo === 'string') {
        try {
          deliveryInfo = JSON.parse(deliveryInfo);
        } catch (e) {
          console.warn(`Erreur de parsing JSON pour ${c.name}:`, e);
          deliveryInfo = null;
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
      } as AcelleCampaign;
    });

    console.log(`${campaigns.length} campagnes préparées pour synchronisation`);

    // Enrichir les campagnes en préservant uniquement les statistiques réelles
    const enrichedCampaigns = await enrichCampaignsWithStats(campaigns, account, token);
    console.log(`Campagnes enrichies: ${enrichedCampaigns.length}`);

    // Compter les statistiques réelles disponibles
    let realStatsCount = 0;

    // Mettre à jour le cache pour toutes les campagnes enrichies
    let updatedCount = 0;
    for (const campaign of enrichedCampaigns) {
      const campaignUid = campaign.uid || campaign.campaign_uid;
      if (!campaignUid) continue;

      try {
        // Vérifier si les statistiques sont réelles
        if (campaign.statistics) {
          realStatsCount++;
        }
        
        // Convertir delivery_info en objet JSON pour éviter l'erreur TypeScript
        const deliveryInfo = campaign.delivery_info ? { ...campaign.delivery_info } : null;
        console.log(`Mise à jour des statistiques dans la base de données pour ${campaign.name} (${campaignUid})`);
        
        const { error } = await supabase
          .from('email_campaigns_cache')
          .update({
            delivery_info: deliveryInfo,
            cache_updated_at: new Date().toISOString()
          })
          .eq('campaign_uid', campaignUid)
          .eq('account_id', account.id);
          
        if (error) {
          console.error(`Erreur lors de la mise à jour du cache pour ${campaignUid}:`, error);
        } else {
          updatedCount++;
        }
      } catch (err) {
        console.error(`Erreur lors de la mise à jour du cache pour ${campaignUid}:`, err);
      }
    }

    console.log(`${updatedCount} campagnes mises à jour dans la base de données (${realStatsCount} avec données réelles)`);
    
    if (realStatsCount > 0) {
      toast.success(`Synchronisation terminée : ${updatedCount} campagnes mises à jour (${realStatsCount} avec données réelles)`, {
        id: "stats-sync"
      });
    } else {
      toast.info(`Synchronisation terminée : ${updatedCount} campagnes mises à jour (aucune donnée réelle disponible)`, {
        id: "stats-sync"
      });
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la synchronisation des statistiques:", error);
    
    toast.error("Erreur lors de la synchronisation des statistiques", {
      id: "stats-sync"
    });
    
    return false;
  }
}
