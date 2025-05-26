
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Phase 2: Récupération robuste des campagnes via Edge Functions
 */
export const getCampaigns = async (
  account: AcelleAccount, 
  options?: { 
    page?: number;
    perPage?: number;
  }
): Promise<{ campaigns: AcelleCampaign[]; hasMore: boolean; total: number }> => {
  try {
    console.log(`[getCampaigns] ROBUSTE - Début pour ${account.name}`);
    
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error("[getCampaigns] Informations de compte incomplètes");
      return { campaigns: [], hasMore: false, total: 0 };
    }

    const page = options?.page || 1;
    const perPage = options?.perPage || 100; // Beaucoup plus de campagnes par page

    console.log(`[getCampaigns] ROBUSTE - Appel Edge Function (page ${page}, perPage ${perPage})`);
    
    // Utiliser l'Edge Function avec timeout ultra-long
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: { 
        endpoint: account.api_endpoint,
        api_token: account.api_token,
        action: 'get_campaigns',
        page: page.toString(),
        per_page: perPage.toString(),
        timeout: 90000 // 90 secondes - timeout massif
      }
    });
    
    if (error) {
      console.error("[getCampaigns] ROBUSTE - Erreur Edge Function:", error);
      throw new Error(error.message || "Erreur lors de la récupération des campagnes");
    }
    
    if (data && data.success && data.campaigns && Array.isArray(data.campaigns)) {
      const campaigns = data.campaigns.map((campaign: any): AcelleCampaign => ({
        uid: campaign.uid,
        campaign_uid: campaign.uid,
        name: campaign.name || '',
        subject: campaign.subject || '',
        status: campaign.status || '',
        created_at: campaign.created_at || '',
        updated_at: campaign.updated_at || '',
        delivery_date: campaign.delivery_at || campaign.run_at || '',
        run_at: campaign.run_at || '',
        last_error: campaign.last_error || '',
        delivery_info: campaign.delivery_info || {},
        statistics: campaign.statistics || createEmptyStatistics()
      }));
      
      console.log(`[getCampaigns] ROBUSTE - ✅ ${campaigns.length} campagnes récupérées pour ${account.name}, Total: ${data.total}`);
      
      return {
        campaigns,
        hasMore: data.has_more || false,
        total: data.total || campaigns.length
      };
    }
    
    console.warn("[getCampaigns] ROBUSTE - Format de réponse inattendu:", data);
    return { campaigns: [], hasMore: false, total: 0 };
  } catch (error) {
    console.error("[getCampaigns] ROBUSTE - Erreur:", error);
    return { campaigns: [], hasMore: false, total: 0 };
  }
};

/**
 * Phase 3: Récupération COMPLÈTE et ROBUSTE de TOUTES les campagnes
 */
export const getAllCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
  try {
    console.log(`[getAllCampaigns] ===== RÉCUPÉRATION COMPLÈTE ROBUSTE ${account.name} =====`);
    
    let allCampaigns: AcelleCampaign[] = [];
    let currentPage = 1;
    const perPage = 100; // Grosse taille de page pour récupérer plus rapidement
    let hasMorePages = true;
    let maxPages = 50; // Limite plus élevée
    
    while (hasMorePages && currentPage <= maxPages) {
      console.log(`[getAllCampaigns] ROBUSTE === PAGE ${currentPage} pour ${account.name} ===`);
      
      try {
        const result = await getCampaigns(account, { 
          page: currentPage, 
          perPage 
        });
        
        const { campaigns, hasMore, total } = result;
        
        if (campaigns.length > 0) {
          // Filtrer les doublons de manière robuste
          const newCampaigns = campaigns.filter(newCampaign => 
            !allCampaigns.some(existing => existing.uid === newCampaign.uid)
          );
          
          allCampaigns = [...allCampaigns, ...newCampaigns];
          
          console.log(`[getAllCampaigns] ROBUSTE - Page ${currentPage}: ${campaigns.length} récupérées, ${newCampaigns.length} nouvelles (total: ${allCampaigns.length}/${total})`);
          
          hasMorePages = hasMore;
          
          if (!hasMore) {
            console.log(`[getAllCampaigns] ROBUSTE - ✅ Fin de pagination pour ${account.name}`);
            break;
          }
          
        } else {
          console.log(`[getAllCampaigns] ROBUSTE - ✅ Page ${currentPage} vide, arrêt pour ${account.name}`);
          break;
        }
        
        currentPage++;
        
        // Pause légère entre les appels
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (pageError) {
        console.error(`[getAllCampaigns] ROBUSTE - ❌ Erreur page ${currentPage} pour ${account.name}:`, pageError);
        break;
      }
    }
    
    console.log(`[getAllCampaigns] ROBUSTE ===== FIN ${account.name}: ${allCampaigns.length} campagnes =====`);
    return allCampaigns;
    
  } catch (error) {
    console.error(`[getAllCampaigns] ROBUSTE - ❌ Erreur générale pour ${account.name}:`, error);
    return [];
  }
};

/**
 * Phase 4: Synchronisation COMPLÈTE et UNIFIÉE
 */
export const forceSyncCampaigns = async (
  account: AcelleAccount,
  accessToken?: string,
  progressCallback?: (progress: { current: number; total: number; message: string }) => void
): Promise<{ success: boolean; message: string; totalCampaigns?: number }> => {
  try {
    if (!account?.id) {
      return { success: false, message: "Aucun compte spécifié" };
    }

    console.log(`[forceSyncCampaigns] ===== SYNCHRONISATION COMPLÈTE ROBUSTE ${account.name} =====`);
    
    progressCallback?.({ current: 0, total: 0, message: `Démarrage synchronisation complète ${account.name}...` });

    // 1. VIDER COMPLÈTEMENT LE CACHE EXISTANT
    console.log(`[forceSyncCampaigns] ROBUSTE - Nettoyage complet cache pour ${account.name}...`);
    progressCallback?.({ current: 0, total: 0, message: `Nettoyage complet cache ${account.name}...` });
    
    await supabase.from('email_campaigns_cache').delete().eq('account_id', account.id);
    await supabase.from('campaign_stats_cache').delete().eq('account_id', account.id);

    // 2. RÉCUPÉRER TOUTES LES CAMPAGNES DE MANIÈRE ROBUSTE
    progressCallback?.({ current: 0, total: 0, message: `Récupération complète campagnes ${account.name}...` });
    
    const allCampaigns = await getAllCampaigns(account);
    
    if (allCampaigns.length === 0) {
      return { 
        success: false, 
        message: `Aucune campagne trouvée pour ${account.name}` 
      };
    }

    console.log(`[forceSyncCampaigns] ROBUSTE - ${allCampaigns.length} campagnes récupérées, mise en cache...`);
    
    // 3. METTRE EN CACHE TOUTES LES CAMPAGNES AVEC STATISTIQUES
    let processedCount = 0;
    
    for (const campaign of allCampaigns) {
      try {
        // Récupérer les statistiques détaillées pour chaque campagne
        const { data: statsData } = await supabase.functions.invoke('acelle-proxy', {
          body: { 
            endpoint: account.api_endpoint,
            api_token: account.api_token,
            action: 'get_campaign_stats',
            campaign_uid: campaign.uid,
            timeout: 30000
          }
        });

        let campaignStats = campaign.statistics || createEmptyStatistics();
        
        // Si on a récupéré des statistiques via l'API, les utiliser
        if (statsData?.success && statsData.statistics) {
          campaignStats = {
            ...campaignStats,
            ...statsData.statistics
          };
        }
        
        // Préparer les données pour le cache avec statistiques intégrées
        const campaignData = {
          account_id: account.id,
          campaign_uid: campaign.uid,
          name: campaign.name || '',
          subject: campaign.subject || '',
          status: campaign.status || '',
          created_at: campaign.created_at || new Date().toISOString(),
          updated_at: campaign.updated_at || new Date().toISOString(),
          delivery_date: campaign.delivery_date || null,
          run_at: campaign.run_at || null,
          last_error: campaign.last_error || null,
          delivery_info: {
            // Stocker TOUTES les statistiques dans delivery_info
            subscriber_count: campaignStats.subscriber_count || 0,
            delivered_count: campaignStats.delivered_count || 0,
            delivered_rate: campaignStats.delivered_rate || 0,
            open_count: campaignStats.open_count || 0,
            uniq_open_count: campaignStats.uniq_open_count || 0,
            uniq_open_rate: campaignStats.uniq_open_rate || 0,
            click_count: campaignStats.click_count || 0,
            click_rate: campaignStats.click_rate || 0,
            bounce_count: campaignStats.bounce_count || 0,
            soft_bounce_count: campaignStats.soft_bounce_count || 0,
            hard_bounce_count: campaignStats.hard_bounce_count || 0,
            unsubscribe_count: campaignStats.unsubscribe_count || 0,
            abuse_complaint_count: campaignStats.abuse_complaint_count || 0,
            // Garder les données originales si elles existent
            ...campaign.delivery_info
          },
          cache_updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('email_campaigns_cache')
          .insert(campaignData);
        
        if (error) {
          console.error(`[forceSyncCampaigns] ROBUSTE - Erreur cache ${campaign.uid}:`, error);
        } else {
          processedCount++;
          console.log(`[forceSyncCampaigns] ROBUSTE - ✅ ${campaign.name} mise en cache avec statistiques`);
        }
      } catch (err) {
        console.error(`[forceSyncCampaigns] ROBUSTE - Exception ${campaign.uid}:`, err);
      }
      
      progressCallback?.({ 
        current: processedCount, 
        total: allCampaigns.length, 
        message: `${processedCount}/${allCampaigns.length} campagnes mises en cache pour ${account.name}` 
      });
    }
    
    // 4. MARQUER LA SYNCHRONISATION COMME RÉUSSIE
    await supabase
      .from('acelle_accounts')
      .update({ 
        last_sync_date: new Date().toISOString(),
        status: 'active',
        last_sync_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id);
    
    progressCallback?.({ 
      current: allCampaigns.length, 
      total: allCampaigns.length, 
      message: `✅ Synchronisation complète terminée pour ${account.name} !` 
    });
    
    console.log(`[forceSyncCampaigns] ROBUSTE - ✅ SYNCHRONISATION COMPLÈTE RÉUSSIE ${account.name}: ${allCampaigns.length} campagnes`);
    
    return { 
      success: true, 
      message: `${allCampaigns.length} campagnes synchronisées avec succès pour ${account.name}`,
      totalCampaigns: allCampaigns.length
    };
    
  } catch (error) {
    console.error(`[forceSyncCampaigns] ROBUSTE - ❌ Erreur pour ${account.name}:`, error);
    
    // Marquer le compte en erreur
    try {
      await supabase
        .from('acelle_accounts')
        .update({ 
          status: 'error',
          last_sync_error: error instanceof Error ? error.message : String(error),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
    } catch (updateError) {
      console.error(`[forceSyncCampaigns] ROBUSTE - Erreur mise à jour:`, updateError);
    }
    
    progressCallback?.({ 
      current: 0, 
      total: 0, 
      message: `❌ Erreur: ${error instanceof Error ? error.message : "Échec"} pour ${account.name}` 
    });
    
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : "Échec de la synchronisation"} pour ${account.name}` 
    };
  }
};

/**
 * Récupère une campagne spécifique par son UID via Edge Functions uniquement
 */
export const getCampaign = async (
  uid: string,
  account: AcelleAccount
): Promise<AcelleCampaign | null> => {
  try {
    console.log(`[getCampaign] Récupération ${uid} pour ${account.name} via Edge Function`);
    
    if (!uid || !account || !account.api_token) {
      console.error("[getCampaign] Paramètres manquants");
      return null;
    }

    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: { 
        endpoint: account.api_endpoint,
        api_token: account.api_token,
        action: 'get_campaign',
        campaign_uid: uid
      }
    });
    
    if (error) {
      console.error("[getCampaign] Erreur Edge Function:", error);
      return null;
    }

    if (data && data.success && data.campaign) {
      const campaign = data.campaign;
      return {
        uid: campaign.uid,
        campaign_uid: campaign.uid,
        name: campaign.name || '',
        subject: campaign.subject || '',
        status: campaign.status || '',
        created_at: campaign.created_at || '',
        updated_at: campaign.updated_at || '',
        delivery_date: campaign.delivery_at || campaign.run_at || '',
        run_at: campaign.run_at || '',
        last_error: campaign.last_error || '',
        delivery_info: campaign.delivery_info || {},
        statistics: campaign.statistics || createEmptyStatistics()
      };
    }
    
    console.warn(`[getCampaign] Campagne ${uid} non trouvée`);
    return null;
  } catch (error) {
    console.error(`[getCampaign] Erreur pour ${uid}:`, error);
    return null;
  }
};

export const extractCampaignsFromCache = async (
  accountId: string,
  options?: {
    page?: number;
    perPage?: number;
  }
): Promise<AcelleCampaign[]> => {
  try {
    const page = options?.page || 1;
    const perPage = options?.perPage || 10;
    const start = (page - 1) * perPage;
    const end = start + perPage - 1;

    console.log(`Extraction des campagnes en cache pour le compte ${accountId}, page ${page}, perPage ${perPage}`);

    let query = supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    query = query.range(start, end);

    const { data, error } = await query;

    if (error) {
      console.error("Erreur lors de l'extraction des campagnes du cache:", error);
      return [];
    }

    const campaigns = data.map((item): AcelleCampaign => {
      let deliveryInfo = {};
      try {
        deliveryInfo = typeof item.delivery_info === 'string' 
          ? JSON.parse(item.delivery_info) 
          : item.delivery_info || {};
      } catch (e) {
        console.warn(`Erreur lors de l'analyse de delivery_info pour la campagne ${item.campaign_uid}:`, e);
      }

      return {
        uid: item.campaign_uid,
        campaign_uid: item.campaign_uid,
        name: item.name || '',
        subject: item.subject || '',
        status: item.status || '',
        created_at: item.created_at || '',
        updated_at: item.updated_at || '',
        delivery_date: item.delivery_date || '',
        run_at: item.run_at || '',
        last_error: item.last_error || '',
        delivery_info: deliveryInfo,
        statistics: createEmptyStatistics()
      };
    });

    console.log(`${campaigns.length} campagnes extraites du cache pour la page ${page}`);
    return campaigns;
  } catch (error) {
    console.error("Erreur lors de l'extraction des campagnes du cache:", error);
    return [];
  }
};

export const getCacheStatus = async (
  accountId: string
): Promise<{ lastUpdated: string | null; count: number }> => {
  try {
    const { data: cacheData, error: cacheError } = await supabase
      .from('email_campaigns_cache')
      .select('cache_updated_at')
      .eq('account_id', accountId)
      .order('cache_updated_at', { ascending: false })
      .limit(1);

    if (cacheError) {
      console.error("Erreur lors de la récupération de l'état du cache:", cacheError);
      return { lastUpdated: null, count: 0 };
    }

    const { count, error: countError } = await supabase
      .from('email_campaigns_cache')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (countError) {
      console.error("Erreur lors du comptage des campagnes en cache:", countError);
      return { 
        lastUpdated: cacheData && cacheData.length > 0 ? cacheData[0].cache_updated_at : null, 
        count: 0 
      };
    }

    return {
      lastUpdated: cacheData && cacheData.length > 0 ? cacheData[0].cache_updated_at : null,
      count: count || 0
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'état du cache:", error);
    return { lastUpdated: null, count: 0 };
  }
};
