import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyStatistics, extractStatisticsFromAnyFormat } from "@/utils/acelle/campaignStats";

/**
 * Récupération SIMPLE et FIABLE des campagnes
 */
export const getCampaigns = async (
  account: AcelleAccount, 
  options?: { 
    page?: number;
    perPage?: number;
  }
): Promise<{ campaigns: AcelleCampaign[]; hasMore: boolean; total: number }> => {
  try {
    console.log(`[getCampaigns] NOUVELLE VERSION - ${account.name}`);
    
    if (!account?.api_token || !account?.api_endpoint) {
      console.error("[getCampaigns] Informations de compte incomplètes");
      return { campaigns: [], hasMore: false, total: 0 };
    }

    const page = options?.page || 1;
    const perPage = options?.perPage || 100;

    console.log(`[getCampaigns] Appel Edge Function - page ${page}, perPage ${perPage}`);
    
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: { 
        endpoint: account.api_endpoint,
        api_token: account.api_token,
        action: 'get_campaigns',
        page: page.toString(),
        per_page: perPage.toString()
      }
    });
    
    if (error) {
      console.error("[getCampaigns] Erreur Edge Function:", error);
      return { campaigns: [], hasMore: false, total: 0 };
    }
    
    if (data?.success && Array.isArray(data.campaigns)) {
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
      
      console.log(`[getCampaigns] ✅ ${campaigns.length} campagnes récupérées, Total: ${data.total}`);
      
      return {
        campaigns,
        hasMore: data.has_more || false,
        total: data.total || campaigns.length
      };
    }
    
    console.warn("[getCampaigns] Format de réponse inattendu:", data);
    return { campaigns: [], hasMore: false, total: 0 };
    
  } catch (error) {
    console.error("[getCampaigns] Erreur:", error);
    return { campaigns: [], hasMore: false, total: 0 };
  }
};

/**
 * Récupération des statistiques d'une campagne spécifique
 */
export const getCampaignStatistics = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<any> => {
  try {
    console.log(`[getCampaignStatistics] Récupération stats pour ${campaignUid}`);
    
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: { 
        endpoint: account.api_endpoint,
        api_token: account.api_token,
        action: 'get_campaign_stats',
        campaign_uid: campaignUid
      }
    });
    
    if (error) {
      console.error(`[getCampaignStatistics] Erreur pour ${campaignUid}:`, error);
      return null;
    }
    
    if (data?.success && data.statistics) {
      console.log(`[getCampaignStatistics] ✅ Stats récupérées pour ${campaignUid}`);
      return data.statistics;
    }
    
    console.warn(`[getCampaignStatistics] Pas de stats pour ${campaignUid}`);
    return null;
    
  } catch (error) {
    console.error(`[getCampaignStatistics] Erreur pour ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Récupération COMPLÈTE de TOUTES les campagnes
 */
export const getAllCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
  try {
    console.log(`[getAllCampaigns] === DÉBUT ${account.name} ===`);
    
    let allCampaigns: AcelleCampaign[] = [];
    let currentPage = 1;
    const perPage = 100;
    let hasMorePages = true;
    let maxPages = 10;
    
    while (hasMorePages && currentPage <= maxPages) {
      console.log(`[getAllCampaigns] Page ${currentPage} pour ${account.name}`);
      
      const result = await getCampaigns(account, { 
        page: currentPage, 
        perPage 
      });
      
      const { campaigns, hasMore, total } = result;
      
      if (campaigns.length > 0) {
        const newCampaigns = campaigns.filter(newCampaign => 
          !allCampaigns.some(existing => existing.uid === newCampaign.uid)
        );
        
        allCampaigns = [...allCampaigns, ...newCampaigns];
        
        console.log(`[getAllCampaigns] Page ${currentPage}: ${campaigns.length} récupérées, ${newCampaigns.length} nouvelles (total: ${allCampaigns.length})`);
        
        hasMorePages = hasMore;
        
        if (!hasMore) {
          console.log(`[getAllCampaigns] ✅ Fin pagination ${account.name}`);
          break;
        }
      } else {
        console.log(`[getAllCampaigns] ✅ Page ${currentPage} vide, arrêt`);
        break;
      }
      
      currentPage++;
      
      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`[getAllCampaigns] === FIN ${account.name}: ${allCampaigns.length} campagnes ===`);
    return allCampaigns;
    
  } catch (error) {
    console.error(`[getAllCampaigns] Erreur pour ${account.name}:`, error);
    return [];
  }
};

/**
 * Synchronisation COMPLÈTE avec récupération séparée des statistiques
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

    console.log(`[forceSyncCampaigns] === SYNC COMPLÈTE AVEC STATS ${account.name} ===`);
    
    progressCallback?.({ current: 0, total: 0, message: `Début synchronisation ${account.name}...` });

    // 1. VIDER LE CACHE
    console.log(`[forceSyncCampaigns] Nettoyage cache ${account.name}...`);
    progressCallback?.({ current: 0, total: 0, message: `Nettoyage cache ${account.name}...` });
    
    await supabase.from('email_campaigns_cache').delete().eq('account_id', account.id);
    console.log(`[forceSyncCampaigns] ✅ Cache vidé pour ${account.name}`);

    // 2. RÉCUPÉRER TOUTES LES CAMPAGNES
    progressCallback?.({ current: 0, total: 0, message: `Récupération campagnes ${account.name}...` });
    
    const allCampaigns = await getAllCampaigns(account);
    
    if (allCampaigns.length === 0) {
      return { 
        success: false, 
        message: `Aucune campagne trouvée pour ${account.name}. Vérifiez la connexion API.` 
      };
    }

    console.log(`[forceSyncCampaigns] ${allCampaigns.length} campagnes récupérées, récupération des statistiques...`);
    
    // 3. RÉCUPÉRER LES STATISTIQUES POUR CHAQUE CAMPAGNE
    progressCallback?.({ current: 0, total: allCampaigns.length, message: `Récupération des statistiques...` });
    
    const enrichedCampaigns = [];
    for (let i = 0; i < allCampaigns.length; i++) {
      const campaign = allCampaigns[i];
      
      progressCallback?.({ 
        current: i + 1, 
        total: allCampaigns.length, 
        message: `Récupération stats ${i + 1}/${allCampaigns.length}: ${campaign.name}` 
      });
      
      // Récupérer les statistiques de cette campagne
      const stats = await getCampaignStatistics(campaign.uid, account);
      
      if (stats) {
        console.log(`[forceSyncCampaigns] ✅ Stats récupérées pour ${campaign.name}`);
        
        // Extraire et formater les statistiques
        const formattedStats = extractStatisticsFromAnyFormat(stats, true);
        
        enrichedCampaigns.push({
          ...campaign,
          delivery_info: formattedStats,
          statistics: formattedStats
        });
      } else {
        console.warn(`[forceSyncCampaigns] ⚠️ Pas de stats pour ${campaign.name}`);
        enrichedCampaigns.push({
          ...campaign,
          delivery_info: createEmptyStatistics(),
          statistics: createEmptyStatistics()
        });
      }
      
      // Petite pause pour éviter de surcharger l'API
      if (i < allCampaigns.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`[forceSyncCampaigns] ${enrichedCampaigns.length} campagnes enrichies, mise en cache...`);
    
    // 4. MISE EN CACHE PAR LOTS avec statistiques
    progressCallback?.({ current: 0, total: enrichedCampaigns.length, message: `Mise en cache des campagnes...` });
    
    const batchSize = 10;
    let processedCount = 0;
    
    for (let i = 0; i < enrichedCampaigns.length; i += batchSize) {
      const batch = enrichedCampaigns.slice(i, i + batchSize);
      
      const campaignData = batch.map(campaign => ({
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
        // IMPORTANT: Stocker les vraies statistiques dans delivery_info
        delivery_info: campaign.delivery_info as any,
        cache_updated_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('email_campaigns_cache')
        .insert(campaignData);
      
      if (error) {
        console.error(`[forceSyncCampaigns] Erreur batch ${i}:`, error);
      } else {
        processedCount += batch.length;
        console.log(`[forceSyncCampaigns] ✅ Batch ${i + 1} inséré (${batch.length} campagnes avec stats)`);
      }
      
      progressCallback?.({ 
        current: processedCount, 
        total: enrichedCampaigns.length, 
        message: `${processedCount}/${enrichedCampaigns.length} campagnes mises en cache avec statistiques` 
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 5. MARQUER LA SYNCHRONISATION RÉUSSIE
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
      current: enrichedCampaigns.length, 
      total: enrichedCampaigns.length, 
      message: `✅ Synchronisation terminée pour ${account.name} avec statistiques !` 
    });
    
    console.log(`[forceSyncCampaigns] ✅ SYNC RÉUSSIE ${account.name}: ${enrichedCampaigns.length} campagnes avec statistiques`);
    
    return { 
      success: true, 
      message: `${enrichedCampaigns.length} campagnes synchronisées avec statistiques pour ${account.name}`,
      totalCampaigns: enrichedCampaigns.length
    };
    
  } catch (error) {
    console.error(`[forceSyncCampaigns] Erreur pour ${account.name}:`, error);
    
    await supabase
      .from('acelle_accounts')
      .update({ 
        status: 'error',
        last_sync_error: error instanceof Error ? error.message : String(error),
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id);
    
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
 * Récupère une campagne spécifique
 */
export const getCampaign = async (
  uid: string,
  account: AcelleAccount
): Promise<AcelleCampaign | null> => {
  try {
    console.log(`[getCampaign] Récupération ${uid} pour ${account.name}`);
    
    if (!uid || !account?.api_token) {
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
    
    if (error || !data?.success) {
      console.error("[getCampaign] Erreur:", error);
      return null;
    }

    if (data.campaign) {
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
    
    return null;
  } catch (error) {
    console.error(`[getCampaign] Erreur pour ${uid}:`, error);
    return null;
  }
};

// Fonction de compatibilité pour extraction du cache
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

    console.log(`[extractCampaignsFromCache] Extraction cache compte ${accountId}`);

    let query = supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    query = query.range(start, end);

    const { data, error } = await query;

    if (error) {
      console.error("Erreur extraction cache:", error);
      return [];
    }

    const campaigns = (data || []).map((item): AcelleCampaign => {
      let deliveryInfo = {};
      try {
        deliveryInfo = typeof item.delivery_info === 'string' 
          ? JSON.parse(item.delivery_info) 
          : item.delivery_info || {};
      } catch (e) {
        console.warn(`Erreur parsing delivery_info pour ${item.campaign_uid}:`, e);
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

    console.log(`[extractCampaignsFromCache] ${campaigns.length} campagnes extraites`);
    return campaigns;
  } catch (error) {
    console.error("Erreur extraction cache:", error);
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
      console.error("Erreur récupération état cache:", cacheError);
      return { lastUpdated: null, count: 0 };
    }

    const { count, error: countError } = await supabase
      .from('email_campaigns_cache')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (countError) {
      console.error("Erreur comptage cache:", countError);
      return { 
        lastUpdated: cacheData?.[0]?.cache_updated_at || null, 
        count: 0 
      };
    }

    return {
      lastUpdated: cacheData?.[0]?.cache_updated_at || null,
      count: count || 0
    };
  } catch (error) {
    console.error("Erreur récupération état cache:", error);
    return { lastUpdated: null, count: 0 };
  }
};
