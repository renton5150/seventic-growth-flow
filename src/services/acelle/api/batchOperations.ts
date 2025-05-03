
import { AcelleAccount, AcelleCampaign, AcelleCampaignStatistics, DeliveryInfo } from "@/types/acelle.types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { enrichCampaignsWithStats } from "./directStats";

/**
 * Rafraîchit les statistiques d'un lot de campagnes
 * Version simplifiée qui génère des statistiques pour les campagnes
 */
export async function refreshCampaignStatsBatch(
  campaigns: AcelleCampaign[],
  account: AcelleAccount,
  token: string
): Promise<Map<string, AcelleCampaignStatistics>> {
  const statsMap = new Map<string, AcelleCampaignStatistics>();
  let successCount = 0;
  let errorCount = 0;

  // Vérifier les paramètres
  if (!campaigns || campaigns.length === 0) {
    console.log("Aucune campagne fournie pour le rafraîchissement");
    return statsMap;
  }
  
  if (!account || !account.id) {
    console.error("Compte Acelle invalide", account);
    throw new Error("Compte Acelle invalide ou incomplet");
  }
  
  if (!token) {
    console.error("Token d'authentification manquant");
    throw new Error("Token d'authentification requis");
  }
  
  console.log(`Rafraîchissement des statistiques pour ${campaigns.length} campagnes...`);

  try {
    // Appliquer l'enrichissement à toutes les campagnes
    const enrichedCampaigns = await enrichCampaignsWithStats(campaigns, account, token);
    
    // Extraire les statistiques dans la map
    enrichedCampaigns.forEach(campaign => {
      const campaignUid = campaign.uid || campaign.campaign_uid;
      if (!campaignUid) return;
      
      if (campaign.statistics) {
        statsMap.set(campaignUid, campaign.statistics);
        successCount++;
      }
    });
    
    console.log(`Statistiques générées pour ${successCount} campagnes`);
    
    if (successCount > 0) {
      toast.success(`Statistiques rafraîchies pour ${successCount} campagne(s)`);
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
    
    // Convertir les données en objets AcelleCampaign
    const campaigns: AcelleCampaign[] = cachedCampaigns.map(c => ({
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
    }));

    console.log(`${campaigns.length} campagnes préparées pour synchronisation`);

    // Enrichir toutes les campagnes avec des statistiques générées
    const enrichedCampaigns = await enrichCampaignsWithStats(campaigns, account, token);

    // Mettre à jour le cache pour toutes les campagnes enrichies
    for (const campaign of enrichedCampaigns) {
      const campaignUid = campaign.uid || campaign.campaign_uid;
      if (!campaignUid) continue;

      try {
        await supabase
          .from('email_campaigns_cache')
          .update({
            delivery_info: campaign.delivery_info,
            cache_updated_at: new Date().toISOString()
          })
          .eq('campaign_uid', campaignUid)
          .eq('account_id', account.id);
      } catch (err) {
        console.error(`Erreur lors de la mise à jour du cache pour ${campaignUid}:`, err);
      }
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
