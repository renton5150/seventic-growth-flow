
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Récupération SIMPLIFIÉE et ROBUSTE des campagnes via Edge Functions
 */
export const getCampaigns = async (
  account: AcelleAccount, 
  options?: { 
    page?: number;
    perPage?: number;
  }
): Promise<{ campaigns: AcelleCampaign[]; hasMore: boolean; total: number }> => {
  try {
    console.log(`[getCampaigns] SIMPLE - Début pour ${account.name}`);
    
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error("[getCampaigns] Informations de compte incomplètes");
      return { campaigns: [], hasMore: false, total: 0 };
    }

    const page = options?.page || 1;
    const perPage = options?.perPage || 50; // Taille raisonnable

    console.log(`[getCampaigns] SIMPLE - Appel Edge Function (page ${page}, perPage ${perPage})`);
    
    // Utiliser l'Edge Function corrigée avec timeout court
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: { 
        endpoint: account.api_endpoint,
        api_token: account.api_token,
        action: 'get_campaigns',
        page: page.toString(),
        per_page: perPage.toString(),
        timeout: 30000 // 30 secondes maximum
      }
    });
    
    if (error) {
      console.error("[getCampaigns] SIMPLE - Erreur Edge Function:", error);
      return { campaigns: [], hasMore: false, total: 0 };
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
      
      console.log(`[getCampaigns] SIMPLE - ✅ ${campaigns.length} campagnes récupérées pour ${account.name}, Total: ${data.total}`);
      
      return {
        campaigns,
        hasMore: data.has_more || false,
        total: data.total || campaigns.length
      };
    }
    
    console.warn("[getCampaigns] SIMPLE - Format de réponse inattendu:", data);
    return { campaigns: [], hasMore: false, total: 0 };
  } catch (error) {
    console.error("[getCampaigns] SIMPLE - Erreur:", error);
    return { campaigns: [], hasMore: false, total: 0 };
  }
};

/**
 * Récupération SIMPLE et COMPLÈTE de TOUTES les campagnes
 */
export const getAllCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
  try {
    console.log(`[getAllCampaigns] ===== RÉCUPÉRATION SIMPLE ${account.name} =====`);
    
    let allCampaigns: AcelleCampaign[] = [];
    let currentPage = 1;
    const perPage = 50; // Taille de page raisonnable
    let hasMorePages = true;
    let maxPages = 20; // Limite raisonnable
    
    while (hasMorePages && currentPage <= maxPages) {
      console.log(`[getAllCampaigns] SIMPLE === PAGE ${currentPage} pour ${account.name} ===`);
      
      try {
        const result = await getCampaigns(account, { 
          page: currentPage, 
          perPage 
        });
        
        const { campaigns, hasMore, total } = result;
        
        if (campaigns.length > 0) {
          // Filtrer les doublons
          const newCampaigns = campaigns.filter(newCampaign => 
            !allCampaigns.some(existing => existing.uid === newCampaign.uid)
          );
          
          allCampaigns = [...allCampaigns, ...newCampaigns];
          
          console.log(`[getAllCampaigns] SIMPLE - Page ${currentPage}: ${campaigns.length} récupérées, ${newCampaigns.length} nouvelles (total: ${allCampaigns.length}/${total})`);
          
          hasMorePages = hasMore;
          
          if (!hasMore) {
            console.log(`[getAllCampaigns] SIMPLE - ✅ Fin de pagination pour ${account.name}`);
            break;
          }
          
        } else {
          console.log(`[getAllCampaigns] SIMPLE - ✅ Page ${currentPage} vide, arrêt pour ${account.name}`);
          break;
        }
        
        currentPage++;
        
        // Pause légère entre les appels
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (pageError) {
        console.error(`[getAllCampaigns] SIMPLE - ❌ Erreur page ${currentPage} pour ${account.name}:`, pageError);
        break;
      }
    }
    
    console.log(`[getAllCampaigns] SIMPLE ===== FIN ${account.name}: ${allCampaigns.length} campagnes =====`);
    return allCampaigns;
    
  } catch (error) {
    console.error(`[getAllCampaigns] SIMPLE - ❌ Erreur générale pour ${account.name}:`, error);
    return [];
  }
};

/**
 * Synchronisation SIMPLIFIÉE et EFFICACE
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

    console.log(`[forceSyncCampaigns] ===== SYNCHRONISATION SIMPLE ${account.name} =====`);
    
    progressCallback?.({ current: 0, total: 0, message: `Démarrage synchronisation ${account.name}...` });

    // 1. VIDER LE CACHE EXISTANT
    console.log(`[forceSyncCampaigns] SIMPLE - Nettoyage cache pour ${account.name}...`);
    progressCallback?.({ current: 0, total: 0, message: `Nettoyage cache ${account.name}...` });
    
    await supabase.from('email_campaigns_cache').delete().eq('account_id', account.id);

    // 2. RÉCUPÉRER TOUTES LES CAMPAGNES
    progressCallback?.({ current: 0, total: 0, message: `Récupération campagnes ${account.name}...` });
    
    const allCampaigns = await getAllCampaigns(account);
    
    if (allCampaigns.length === 0) {
      return { 
        success: false, 
        message: `Aucune campagne trouvée pour ${account.name}` 
      };
    }

    console.log(`[forceSyncCampaigns] SIMPLE - ${allCampaigns.length} campagnes récupérées, mise en cache...`);
    
    // 3. METTRE EN CACHE TOUTES LES CAMPAGNES AVEC STATISTIQUES SIMPLES
    let processedCount = 0;
    
    for (const campaign of allCampaigns) {
      try {
        // Préparer les données pour le cache avec statistiques simples
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
          delivery_info: (campaign.delivery_info || campaign.statistics || {}) as any, // Fix TypeScript error by casting to any
          cache_updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('email_campaigns_cache')
          .insert(campaignData);
        
        if (error) {
          console.error(`[forceSyncCampaigns] SIMPLE - Erreur cache ${campaign.uid}:`, error);
        } else {
          processedCount++;
          console.log(`[forceSyncCampaigns] SIMPLE - ✅ ${campaign.name} mise en cache`);
        }
      } catch (err) {
        console.error(`[forceSyncCampaigns] SIMPLE - Exception ${campaign.uid}:`, err);
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
      message: `✅ Synchronisation terminée pour ${account.name} !` 
    });
    
    console.log(`[forceSyncCampaigns] SIMPLE - ✅ SYNCHRONISATION RÉUSSIE ${account.name}: ${allCampaigns.length} campagnes`);
    
    return { 
      success: true, 
      message: `${allCampaigns.length} campagnes synchronisées avec succès pour ${account.name}`,
      totalCampaigns: allCampaigns.length
    };
    
  } catch (error) {
    console.error(`[forceSyncCampaigns] SIMPLE - ❌ Erreur pour ${account.name}:`, error);
    
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
      console.error(`[forceSyncCampaigns] SIMPLE - Erreur mise à jour:`, updateError);
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
 * Récupère une campagne spécifique par son UID
 */
export const getCampaign = async (
  uid: string,
  account: AcelleAccount
): Promise<AcelleCampaign | null> => {
  try {
    console.log(`[getCampaign] Récupération ${uid} pour ${account.name}`);
    
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

// Fonctions de compatibilité simplifiées
export const extractCampaignsFromCache = async (
  accountId: string,
  options?: {
    page?: number;
    perPage?: number;
  }
): Promise<AcelleCampaign[]> => {
  try {
    const page = options?.page || 1;
    const perPage = options?.perPage || 50;
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

    const campaigns = (data || []).map((item): AcelleCampaign => {
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
