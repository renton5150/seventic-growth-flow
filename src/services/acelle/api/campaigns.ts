import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Récupère les campagnes d'un compte Acelle via Edge Functions uniquement avec pagination améliorée
 */
export const getCampaigns = async (
  account: AcelleAccount, 
  options?: { 
    page?: number;
    perPage?: number;
  }
): Promise<{ campaigns: AcelleCampaign[]; hasMore: boolean; total: number }> => {
  try {
    console.log(`[getCampaigns] Début pour ${account.name} via Edge Function`);
    
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error("[getCampaigns] Informations de compte incomplètes");
      return { campaigns: [], hasMore: false, total: 0 };
    }

    const page = options?.page || 1;
    const perPage = options?.perPage || 25; // Réduire encore plus pour éviter les timeouts

    console.log(`[getCampaigns] Appel Edge Function pour récupérer les campagnes (page ${page}, perPage ${perPage})`);
    
    // Utiliser l'Edge Function avec timeout encore plus réduit
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: { 
        endpoint: account.api_endpoint,
        api_token: account.api_token,
        action: 'get_campaigns',
        page: page.toString(),
        per_page: perPage.toString(),
        timeout: 30000 // Réduire à 30 secondes
      }
    });
    
    if (error) {
      console.error("[getCampaigns] Erreur Edge Function:", error);
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
      
      console.log(`[getCampaigns] ${campaigns.length} campagnes récupérées pour ${account.name} (page ${page})`);
      
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
    
    // Mettre à jour le statut du compte en cas d'erreur
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
      console.error("[getCampaigns] Erreur mise à jour statut:", updateError);
    }
    
    return { campaigns: [], hasMore: false, total: 0 };
  }
};

/**
 * Récupère TOUTES les campagnes d'un compte avec pagination ultra-robuste
 */
export const getAllCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
  try {
    console.log(`[getAllCampaigns] ===== DÉBUT RÉCUPÉRATION ULTRA-ROBUSTE POUR ${account.name} =====`);
    
    let allCampaigns: AcelleCampaign[] = [];
    let currentPage = 1;
    const perPage = 15; // Très petite taille pour maximiser la réussite
    let hasMorePages = true;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 1; // Très strict
    let totalFromFirstPage = 0;
    
    // Test de connexion initial plus léger
    console.log(`[getAllCampaigns] Test de connexion ultra-léger pour ${account.name}...`);
    try {
      const testResult = await getCampaigns(account, { page: 1, perPage: 1 });
      if (testResult.campaigns.length === 0 && testResult.total === 0) {
        console.log(`[getAllCampaigns] Aucune campagne trouvée pour ${account.name}`);
        return [];
      }
      totalFromFirstPage = testResult.total;
      console.log(`[getAllCampaigns] Test réussi - ${totalFromFirstPage} campagnes attendues pour ${account.name}`);
    } catch (testError) {
      console.error(`[getAllCampaigns] Test de connexion échoué pour ${account.name}:`, testError);
      return [];
    }
    
    // Calculer le nombre de pages de manière plus intelligente
    const expectedPages = Math.min(Math.ceil(totalFromFirstPage / perPage), 50); // Maximum 50 pages
    console.log(`[getAllCampaigns] Pages attendues: ${expectedPages} pour ${account.name}`);
    
    while (hasMorePages && consecutiveFailures < maxConsecutiveFailures && currentPage <= expectedPages) {
      console.log(`[getAllCampaigns] === PAGE ${currentPage}/${expectedPages} pour ${account.name} ===`);
      
      try {
        const result = await getCampaigns(account, { 
          page: currentPage, 
          perPage 
        });
        
        const { campaigns, hasMore, total } = result;
        
        if (campaigns.length > 0) {
          // Filtrer les doublons par UID
          const newCampaigns = campaigns.filter(newCampaign => 
            !allCampaigns.some(existingCampaign => 
              existingCampaign.uid === newCampaign.uid || 
              existingCampaign.campaign_uid === newCampaign.uid
            )
          );
          
          allCampaigns = [...allCampaigns, ...newCampaigns];
          consecutiveFailures = 0; // Reset le compteur d'échecs
          
          console.log(`[getAllCampaigns] Page ${currentPage}: ${campaigns.length} récupérées, ${newCampaigns.length} nouvelles (total: ${allCampaigns.length}/${totalFromFirstPage || total}) pour ${account.name}`);
          
          // Logique de fin de pagination améliorée
          hasMorePages = hasMore && (currentPage < expectedPages);
          
          if (!hasMore) {
            console.log(`[getAllCampaigns] ✅ Fin de pagination détectée par l'API pour ${account.name}`);
            break;
          }
          
          // Vérification de sécurité plus stricte
          if (totalFromFirstPage > 0 && allCampaigns.length >= totalFromFirstPage) {
            console.log(`[getAllCampaigns] ✅ Total attendu atteint: ${allCampaigns.length}/${totalFromFirstPage} pour ${account.name}`);
            break;
          }
          
        } else {
          // Page vide - arrêter immédiatement
          console.log(`[getAllCampaigns] ✅ Page ${currentPage} vide, fin de pagination pour ${account.name}`);
          hasMorePages = false;
          break;
        }
        
        currentPage++;
        
        // Pause plus longue entre les appels pour éviter la surcharge
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde entre les appels
        }
        
      } catch (pageError) {
        consecutiveFailures++;
        console.error(`[getAllCampaigns] ❌ Erreur page ${currentPage} pour ${account.name} (échec ${consecutiveFailures}/${maxConsecutiveFailures}):`, pageError);
        
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.log(`[getAllCampaigns] ❌ Arrêt après ${maxConsecutiveFailures} échec pour ${account.name}`);
          break;
        }
        
        // Attendre avant de continuer
        await new Promise(resolve => setTimeout(resolve, 3000));
        currentPage++;
      }
    }
    
    console.log(`[getAllCampaigns] ===== FIN RÉCUPÉRATION ${account.name}: ${allCampaigns.length} campagnes =====`);
    
    return allCampaigns;
  } catch (error) {
    console.error(`[getAllCampaigns] ❌ Erreur générale pour ${account.name}:`, error);
    return [];
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

    // Utiliser l'Edge Function corrigée
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

/**
 * Force la synchronisation complète des campagnes pour un compte avec robustesse maximale
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

    console.log(`[forceSyncCampaigns] ===== SYNCHRONISATION ULTRA-ROBUSTE ${account.name} =====`);
    
    // Notifier le début
    progressCallback?.({ current: 0, total: 0, message: `Préparation synchronisation pour ${account.name}...` });

    // Marquer le début de la synchronisation
    await supabase
      .from('acelle_accounts')
      .update({ 
        status: 'active',
        last_sync_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id);

    // Vider complètement l'ancien cache AVANT la récupération
    console.log(`[forceSyncCampaigns] Nettoyage complet du cache pour ${account.name}...`);
    progressCallback?.({ current: 0, total: 0, message: `Nettoyage cache pour ${account.name}...` });
    
    await supabase
      .from('email_campaigns_cache')
      .delete()
      .eq('account_id', account.id);
    
    await supabase
      .from('campaign_stats_cache')
      .delete()
      .eq('account_id', account.id);

    // Récupérer TOUTES les campagnes avec la logique ultra-robuste
    progressCallback?.({ current: 0, total: 0, message: `Récupération complète pour ${account.name}...` });
    
    const allCampaigns = await getAllCampaigns(account);
    
    if (allCampaigns.length > 0) {
      console.log(`[forceSyncCampaigns] ${allCampaigns.length} campagnes récupérées pour ${account.name}, début mise en cache...`);
      
      progressCallback?.({ 
        current: 0, 
        total: allCampaigns.length, 
        message: `Mise en cache de ${allCampaigns.length} campagnes pour ${account.name}...` 
      });
      
      // Mettre en cache les campagnes par très petits lots
      const batchSize = 1; // Un par un pour maximiser la réussite
      let processedCount = 0;
      
      for (let i = 0; i < allCampaigns.length; i += batchSize) {
        const batch = allCampaigns.slice(i, i + batchSize);
        
        console.log(`[forceSyncCampaigns] Traitement campagne ${i + 1}/${allCampaigns.length} pour ${account.name}`);
        
        for (const campaign of batch) {
          try {
            // Nettoyer les valeurs pour éviter les erreurs
            const cleanCampaign = {
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
              delivery_info: campaign.delivery_info as any,
              cache_updated_at: new Date().toISOString()
            };
            
            const { error } = await supabase
              .from('email_campaigns_cache')
              .insert(cleanCampaign);
            
            if (error) {
              console.error(`[forceSyncCampaigns] Erreur cache ${campaign.uid} pour ${account.name}:`, error);
            } else {
              console.log(`[forceSyncCampaigns] ✅ Campagne ${campaign.name} mise en cache pour ${account.name}`);
              processedCount++;
            }
          } catch (err) {
            console.error(`[forceSyncCampaigns] Exception cache ${campaign.uid} pour ${account.name}:`, err);
          }
        }
        
        progressCallback?.({ 
          current: processedCount, 
          total: allCampaigns.length, 
          message: `${processedCount}/${allCampaigns.length} campagnes mises en cache pour ${account.name}` 
        });
        
        // Pause entre chaque campagne
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Marquer la synchronisation comme réussie
      await supabase
        .from('acelle_accounts')
        .update({ 
          last_sync_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      
      progressCallback?.({ 
        current: allCampaigns.length, 
        total: allCampaigns.length, 
        message: `Synchronisation terminée avec succès pour ${account.name} !` 
      });
      
      console.log(`[forceSyncCampaigns] ✅ SYNCHRONISATION RÉUSSIE pour ${account.name}: ${allCampaigns.length} campagnes`);
      
      return { 
        success: true, 
        message: `${allCampaigns.length} campagnes synchronisées avec succès pour ${account.name}`,
        totalCampaigns: allCampaigns.length
      };
    } else {
      // Marquer comme erreur si aucune campagne
      await supabase
        .from('acelle_accounts')
        .update({ 
          status: 'error',
          last_sync_error: 'Aucune campagne trouvée',
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      
      console.log(`[forceSyncCampaigns] ❌ Aucune campagne trouvée pour ${account.name}`);
      
      return { 
        success: false, 
        message: `Aucune campagne trouvée ou erreur de connexion pour ${account.name}` 
      };
    }
  } catch (error) {
    console.error(`[forceSyncCampaigns] ❌ Erreur pour ${account.name}:`, error);
    
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
      console.error(`[forceSyncCampaigns] Erreur mise à jour pour ${account.name}:`, updateError);
    }
    
    progressCallback?.({ 
      current: 0, 
      total: 0, 
      message: `Erreur: ${error instanceof Error ? error.message : "Échec de la synchronisation"} pour ${account.name}` 
    });
    
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : "Échec de la synchronisation"} pour ${account.name}` 
    };
  }
};

/**
 * Extraire les campagnes du cache par le compte avec pagination améliorée
 */
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

    // Appliquer la pagination
    query = query.range(start, end);

    const { data, error } = await query;

    if (error) {
      console.error("Erreur lors de l'extraction des campagnes du cache:", error);
      return [];
    }

    const campaigns = data.map((item): AcelleCampaign => {
      // Analyser delivery_info
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
        statistics: createEmptyStatistics() // Les statistiques seront enrichies plus tard
      };
    });

    console.log(`${campaigns.length} campagnes extraites du cache pour la page ${page}`);
    return campaigns;
  } catch (error) {
    console.error("Erreur lors de l'extraction des campagnes du cache:", error);
    return [];
  }
};

/**
 * Obtenir le statut du cache des campagnes
 */
export const getCacheStatus = async (
  accountId: string
): Promise<{ lastUpdated: string | null; count: number }> => {
  try {
    // Vérifier quand le cache a été mis à jour pour la dernière fois
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

    // Compter le nombre de campagnes en cache
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
