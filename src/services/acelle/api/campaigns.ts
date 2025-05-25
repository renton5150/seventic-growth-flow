
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
    const perPage = options?.perPage || 200; // Augmenter à 200

    console.log(`[getCampaigns] Appel Edge Function pour récupérer les campagnes (page ${page}, perPage ${perPage})`);
    
    // Utiliser l'Edge Function avec timeout augmenté
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: { 
        endpoint: account.api_endpoint,
        api_token: account.api_token,
        action: 'get_campaigns',
        page: page.toString(),
        per_page: perPage.toString(),
        timeout: 60000 // 60 secondes
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
 * Récupère TOUTES les campagnes d'un compte avec pagination robuste et retry intelligent
 */
export const getAllCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
  try {
    console.log(`[getAllCampaigns] Début récupération complète pour ${account.name}`);
    
    let allCampaigns: AcelleCampaign[] = [];
    let currentPage = 1;
    const perPage = 500; // Utiliser une taille de page plus grande
    let hasMorePages = true;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;
    let totalExpected = 0;
    
    while (hasMorePages && consecutiveFailures < maxConsecutiveFailures && currentPage <= 20) {
      console.log(`[getAllCampaigns] Récupération page ${currentPage} pour ${account.name}`);
      
      try {
        const result = await getCampaigns(account, { 
          page: currentPage, 
          perPage 
        });
        
        const { campaigns, hasMore, total } = result;
        
        // Mettre à jour le total attendu à la première page
        if (currentPage === 1 && total > 0) {
          totalExpected = total;
          console.log(`[getAllCampaigns] Total attendu: ${totalExpected} campagnes`);
        }
        
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
          
          console.log(`[getAllCampaigns] Page ${currentPage}: ${campaigns.length} campagnes récupérées, ${newCampaigns.length} nouvelles (total actuel: ${allCampaigns.length}/${totalExpected})`);
          
          // Utiliser hasMore de l'API pour déterminer s'il y a plus de pages
          hasMorePages = hasMore;
          
          if (!hasMore) {
            console.log(`[getAllCampaigns] Fin de pagination détectée pour ${account.name} (hasMore: false)`);
            break;
          }
        } else {
          // Page vide
          if (currentPage === 1) {
            // Si la première page est vide, il n'y a pas de campagnes
            console.log(`[getAllCampaigns] Aucune campagne trouvée pour ${account.name}`);
            hasMorePages = false;
          } else {
            // Si une page ultérieure est vide, on considère qu'on a atteint la fin
            console.log(`[getAllCampaigns] Page ${currentPage} vide, fin de pagination pour ${account.name}`);
            hasMorePages = false;
          }
        }
        
        currentPage++;
        
        // Pause plus courte entre les appels
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms entre les appels
        }
        
      } catch (pageError) {
        consecutiveFailures++;
        console.error(`[getAllCampaigns] Erreur page ${currentPage} pour ${account.name} (échec ${consecutiveFailures}/${maxConsecutiveFailures}):`, pageError);
        
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.log(`[getAllCampaigns] Arrêt après ${maxConsecutiveFailures} échecs consécutifs`);
          break;
        }
        
        // Attendre moins longtemps en cas d'erreur
        await new Promise(resolve => setTimeout(resolve, 2000));
        currentPage++;
      }
    }
    
    console.log(`[getAllCampaigns] Récupération terminée pour ${account.name}: ${allCampaigns.length} campagnes au total`);
    
    // Vérifier si on a récupéré toutes les campagnes attendues
    if (totalExpected > 0 && allCampaigns.length < totalExpected) {
      console.warn(`[getAllCampaigns] Récupération incomplète pour ${account.name}: ${allCampaigns.length}/${totalExpected} campagnes`);
    }
    
    return allCampaigns;
  } catch (error) {
    console.error(`[getAllCampaigns] Erreur générale pour ${account.name}:`, error);
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
 * Force la synchronisation complète des campagnes pour un compte avec pagination robuste
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

    console.log(`[forceSyncCampaigns] Synchronisation complète pour ${account.name}`);
    
    // Notifier le début
    progressCallback?.({ current: 0, total: 0, message: "Démarrage de la synchronisation..." });

    // Marquer le début de la synchronisation
    await supabase
      .from('acelle_accounts')
      .update({ 
        status: 'active',
        last_sync_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id);

    // Récupérer TOUTES les campagnes avec la logique améliorée
    progressCallback?.({ current: 0, total: 0, message: "Récupération de toutes les campagnes..." });
    
    const allCampaigns = await getAllCampaigns(account);
    
    if (allCampaigns.length > 0) {
      console.log(`[forceSyncCampaigns] ${allCampaigns.length} campagnes récupérées, mise en cache...`);
      
      progressCallback?.({ 
        current: 0, 
        total: allCampaigns.length, 
        message: `Mise en cache de ${allCampaigns.length} campagnes...` 
      });
      
      // Mettre en cache les campagnes par lots avec correction des valeurs vides
      const batchSize = 10; // Réduire la taille des lots pour éviter les timeouts
      let processedCount = 0;
      
      for (let i = 0; i < allCampaigns.length; i += batchSize) {
        const batch = allCampaigns.slice(i, i + batchSize);
        
        const cachePromises = batch.map(async (campaign) => {
          try {
            // Nettoyer les valeurs pour éviter les erreurs de timestamp
            const cleanCampaign = {
              account_id: account.id,
              campaign_uid: campaign.uid,
              name: campaign.name || '',
              subject: campaign.subject || '',
              status: campaign.status || '',
              created_at: campaign.created_at || null,
              updated_at: campaign.updated_at || null,
              delivery_date: campaign.delivery_date || null,
              run_at: campaign.run_at || null, // Utiliser null au lieu de chaîne vide
              last_error: campaign.last_error || null,
              delivery_info: campaign.delivery_info || {},
              cache_updated_at: new Date().toISOString()
            };
            
            const { error } = await supabase
              .from('email_campaigns_cache')
              .upsert(cleanCampaign, {
                onConflict: 'account_id,campaign_uid'
              });
            
            if (error) {
              console.error(`[forceSyncCampaigns] Erreur cache ${campaign.uid}:`, error);
            } else {
              console.log(`[forceSyncCampaigns] Campagne ${campaign.name} mise en cache`);
            }
          } catch (err) {
            console.error(`[forceSyncCampaigns] Exception cache ${campaign.uid}:`, err);
          }
        });
        
        await Promise.all(cachePromises);
        processedCount += batch.length;
        
        progressCallback?.({ 
          current: processedCount, 
          total: allCampaigns.length, 
          message: `${processedCount}/${allCampaigns.length} campagnes mises en cache` 
        });
        
        // Pause plus courte pour améliorer les performances
        await new Promise(resolve => setTimeout(resolve, 100));
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
        message: "Synchronisation terminée avec succès !" 
      });
      
      return { 
        success: true, 
        message: `${allCampaigns.length} campagnes synchronisées avec succès`,
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
      
      return { 
        success: false, 
        message: "Aucune campagne trouvée ou erreur de connexion" 
      };
    }
  } catch (error) {
    console.error("[forceSyncCampaigns] Erreur:", error);
    
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
      console.error("[forceSyncCampaigns] Erreur mise à jour:", updateError);
    }
    
    progressCallback?.({ 
      current: 0, 
      total: 0, 
      message: `Erreur: ${error instanceof Error ? error.message : "Échec de la synchronisation"}` 
    });
    
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : "Échec de la synchronisation"}` 
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
