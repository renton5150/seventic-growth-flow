
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildProxyUrl } from "@/utils/acelle/proxyUtils";
import { toast } from 'sonner';

/**
 * Récupère toutes les campagnes d'un compte Acelle
 * Recherche d'abord dans le cache, puis interroge l'API si nécessaire
 */
export const getCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
  if (!account) return [];
  
  try {
    // Recherche dans le cache
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', account.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transformer les données du cache pour correspondre au type AcelleCampaign
    return (data || []).map(item => ({
      uid: item.campaign_uid,
      campaign_uid: item.campaign_uid,
      name: item.name,
      subject: item.subject,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      delivery_date: item.delivery_date,
      run_at: item.run_at,
      last_error: item.last_error,
      delivery_info: item.delivery_info,
      // Autres propriétés si nécessaires
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des campagnes:", error);
    return [];
  }
};

/**
 * Extrait les campagnes du cache pour un compte donné
 */
export const extractCampaignsFromCache = async (accountId: string, page = 1, perPage = 10): Promise<AcelleCampaign[]> => {
  try {
    // Calcul du décalage pour la pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    
    // Récupérer les campagnes du cache avec pagination
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error("Erreur lors de l'extraction des campagnes du cache:", error);
      return [];
    }
    
    // Transformer les données du cache pour correspondre au type AcelleCampaign
    return (data || []).map(item => ({
      uid: item.campaign_uid,
      campaign_uid: item.campaign_uid,
      name: item.name,
      subject: item.subject,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      delivery_date: item.delivery_date,
      run_at: item.run_at,
      last_error: item.last_error,
      delivery_info: item.delivery_info,
      // Autres propriétés si nécessaires
    }));
  } catch (error) {
    console.error("Erreur lors de l'extraction des campagnes du cache:", error);
    return [];
  }
};

/**
 * Obtient le statut du cache pour un compte spécifique
 */
export const getCacheStatus = async (accountId: string): Promise<{ lastUpdated: string | null; count: number }> => {
  try {
    // Récupérer le nombre total de campagnes en cache
    const { count: totalCount, error: countError } = await supabase
      .from('email_campaigns_cache')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);
    
    if (countError) {
      throw countError;
    }
    
    // Récupérer la date de dernière mise à jour du cache
    const { data: latestUpdate, error: updateError } = await supabase
      .from('email_campaigns_cache')
      .select('cache_updated_at')
      .eq('account_id', accountId)
      .order('cache_updated_at', { ascending: false })
      .limit(1)
      .single();
    
    // Si aucune date n'est trouvée ou une erreur se produit, retourner null
    const lastUpdated = updateError ? null : latestUpdate?.cache_updated_at;
    
    return {
      lastUpdated,
      count: totalCount || 0
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du statut du cache:", error);
    return {
      lastUpdated: null,
      count: 0
    };
  }
};

/**
 * Récupère une campagne spécifique par son UID
 */
export const getCampaign = async (campaignUid: string, account: AcelleAccount): Promise<AcelleCampaign | null> => {
  if (!campaignUid || !account) return null;
  
  try {
    // Recherche dans le cache
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', account.id)
      .eq('campaign_uid', campaignUid)
      .single();
    
    if (error) return null;
    
    // Transformer les données du cache pour correspondre au type AcelleCampaign
    return {
      uid: data.campaign_uid,
      campaign_uid: data.campaign_uid,
      name: data.name,
      subject: data.subject,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      delivery_date: data.delivery_date,
      run_at: data.run_at,
      last_error: data.last_error,
      delivery_info: data.delivery_info,
      // Autres propriétés si nécessaires
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération de la campagne ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Force la synchronisation des campagnes pour un compte Acelle
 */
export const forceSyncCampaigns = async (account: AcelleAccount): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> => {
  if (!account) {
    return {
      success: false,
      error: "Compte Acelle non fourni"
    };
  }
  
  try {
    console.log(`Demande de synchronisation forcée pour le compte ${account.name}`);
    
    // Obtenir un token d'authentification pour appeler la fonction Edge
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error("Erreur d'authentification pour la synchronisation:", sessionError);
      return {
        success: false, 
        error: "Erreur d'authentification: " + (sessionError?.message || "Session non disponible")
      };
    }
    
    const accessToken = sessionData.session.access_token;
    
    // Diagnostic préalable pour comprendre l'état actuel des tables
    try {
      console.log("Diagnostic des tables avant synchronisation");
      
      const { data: diagData, error: diagError } = await supabase.functions.invoke('sync-email-campaigns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Debug-Level': '4' // Niveau debug élevé pour plus de logs
        },
        body: {
          accountId: account.id,
          action: 'diagnose'
        }
      });
      
      if (diagError) {
        console.error("Erreur lors du diagnostic:", diagError);
      } else {
        console.log("Résultat du diagnostic:", diagData);
      }
    } catch (diagErr) {
      console.error("Exception lors du diagnostic:", diagErr);
    }
    
    // Appeler la fonction Edge pour forcer la synchronisation
    const { data, error } = await supabase.functions.invoke('sync-email-campaigns', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Debug-Level': '4' // Niveau debug élevé pour plus de logs
      },
      body: {
        accountId: account.id,
        apiToken: account.api_token,
        apiEndpoint: account.api_endpoint,
        authMethod: 'url-param'
      }
    });
    
    if (error) {
      console.error("Erreur lors de l'appel à la fonction de synchronisation:", error);
      return {
        success: false,
        error: `Erreur serveur: ${error.message}`
      };
    }
    
    // Force une mise à jour des statistiques agrégées
    try {
      console.log("Force update stats via RPC pour", account.id);
      const { data: forceData, error: forceError } = await supabase.rpc('force_update_campaign_stats', {
        account_id_param: account.id
      });
      
      if (forceError) {
        console.error("Erreur lors de la mise à jour forcée via RPC:", forceError);
      } else {
        console.log("Résultat du force_update_campaign_stats:", forceData);
      }
    } catch (forceErr) {
      console.error("Exception lors du forçage des stats:", forceErr);
    }
    
    // Mise à jour des statistiques agrégées finale
    try {
      console.log("Agrégation finale via RPC pour", account.id);
      const { error: aggError } = await supabase.rpc('update_acelle_campaign_stats', {
        account_id_param: account.id
      });
      
      if (aggError) {
        console.error("Erreur lors de l'agrégation finale:", aggError);
      } else {
        console.log("Agrégation finale réussie");
      }
    } catch (aggErr) {
      console.error("Exception lors de l'agrégation finale:", aggErr);
    }
    
    if (data && data.success) {
      return {
        success: true,
        message: data.message || "Synchronisation effectuée avec succès"
      };
    } else {
      return {
        success: false,
        error: (data && data.message) || "Erreur pendant la synchronisation"
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Exception lors de la synchronisation:", error);
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
