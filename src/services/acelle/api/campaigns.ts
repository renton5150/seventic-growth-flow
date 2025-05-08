
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { buildProxyUrl } from "@/utils/acelle/proxyUtils";

/**
 * Extrait les campagnes du cache pour un compte spécifique
 */
export const extractCampaignsFromCache = async (
  accountId: string,
  page = 1,
  perPage = 10
): Promise<AcelleCampaign[]> => {
  try {
    // Calcul des limites pour la pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    
    // Récupérer les campagnes en cache
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    // Transformer les données pour qu'elles correspondent au type AcelleCampaign
    return data.map(campaign => ({
      uid: campaign.campaign_uid,
      campaign_uid: campaign.campaign_uid,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      delivery_date: campaign.delivery_date,
      run_at: campaign.run_at,
      last_error: campaign.last_error,
      // Traiter le delivery_info en le castant pour correspondre au type DeliveryInfo
      delivery_info: campaign.delivery_info as any,
    }));
  } catch (error) {
    console.error("Erreur lors de l'extraction des campagnes du cache", error);
    return [];
  }
};

/**
 * Récupère l'état du cache des campagnes
 */
export const getCacheStatus = async (accountId: string): Promise<{ lastUpdated: string | null; count: number }> => {
  try {
    // Vérifier quand le cache a été mis à jour pour la dernière fois
    const { data: account } = await supabase
      .from('acelle_accounts')
      .select('cache_last_updated')
      .eq('id', accountId)
      .single();
    
    // Compter le nombre de campagnes en cache
    const { count, error } = await supabase
      .from('email_campaigns_cache')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);
    
    if (error) throw error;
    
    return {
      lastUpdated: account?.cache_last_updated || null,
      count: count || 0
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du statut du cache", error);
    return { lastUpdated: null, count: 0 };
  }
};

/**
 * Récupère toutes les campagnes pour un compte
 */
export const getCampaigns = async (account: AcelleAccount): Promise<AcelleCampaign[]> => {
  try {
    // Récupérer via l'API proxy
    const apiUrl = `/api/campaigns`;
    const fullUrl = buildProxyUrl(account.api_endpoint, apiUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${account.api_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    
    // En cas d'échec, essayer de récupérer depuis le cache
    try {
      // Récupérer les campagnes du cache pour ce compte
      const { data, error: dbError } = await supabase
        .from('email_campaigns_cache')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false });
        
      if (dbError) throw dbError;
      
      // Transformer les données pour correspondre au type AcelleCampaign
      const campaigns = data.map(item => ({
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
        // Traiter correctement delivery_info en le castant
        delivery_info: item.delivery_info as any,
      }));
      
      return campaigns;
    } catch (cacheError) {
      console.error("Error fetching from cache:", cacheError);
      return [];
    }
  }
};

/**
 * Récupère les détails d'une campagne spécifique
 */
export const getCampaign = async (campaignUid: string, account: AcelleAccount): Promise<AcelleCampaign | null> => {
  try {
    // Vérifier d'abord dans le cache
    const { data: cachedData, error: cacheError } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('campaign_uid', campaignUid)
      .eq('account_id', account.id)
      .maybeSingle();
      
    if (cachedData && !cacheError) {
      // Si trouvé en cache, retourner
      return {
        uid: cachedData.campaign_uid,
        campaign_uid: cachedData.campaign_uid,
        name: cachedData.name,
        subject: cachedData.subject,
        status: cachedData.status,
        created_at: cachedData.created_at,
        updated_at: cachedData.updated_at,
        delivery_date: cachedData.delivery_date,
        run_at: cachedData.run_at,
        last_error: cachedData.last_error,
        // Attention au typage ici pour corriger l'erreur
        delivery_info: cachedData.delivery_info as any,
      };
    }
    
    // Si pas en cache ou erreur, récupérer via l'API
    const apiUrl = `/api/campaigns/${campaignUid}`;
    const fullUrl = buildProxyUrl(account.api_endpoint, apiUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${account.api_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const campaignData = await response.json();
    return campaignData;
  } catch (error) {
    console.error(`Error fetching campaign ${campaignUid}:`, error);
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
