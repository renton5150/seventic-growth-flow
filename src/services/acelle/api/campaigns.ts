
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildProxyUrl } from "../acelle-service";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Récupère les campagnes d'un compte Acelle depuis l'API
 */
export const getCampaigns = async (
  account: AcelleAccount, 
  options?: { 
    page?: number;
    perPage?: number;
  }
): Promise<AcelleCampaign[]> => {
  try {
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error("Informations de compte incomplètes pour la récupération des campagnes");
      return [];
    }

    const page = options?.page || 1;
    const perPage = options?.perPage || 20;

    // Construction des paramètres
    const params = {
      api_token: account.api_token,
      page: page.toString(),
      per_page: perPage.toString(),
      _t: Date.now().toString() // Empêche la mise en cache
    };

    // Construction de l'URL
    const url = buildProxyUrl("campaigns", params);
    console.log(`Requesting campaigns from API: ${url}`);

    // Récupérer le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      console.error("Aucun token d'authentification disponible");
      return [];
    }

    // Effectuer la requête API
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      return [];
    }

    // Traiter la réponse
    const data = await response.json();
    
    // Normaliser les données des campagnes
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((campaign: any): AcelleCampaign => ({
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
    }
    
    console.error("Format de réponse API inattendu:", data);
    return [];
  } catch (error) {
    console.error("Erreur lors de la récupération des campagnes:", error);
    return [];
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
    if (!uid || !account || !account.api_token) {
      return null;
    }

    // Construction des paramètres
    const params = {
      api_token: account.api_token,
      _t: Date.now().toString()
    };

    // Construction de l'URL
    const url = buildProxyUrl(`campaigns/${uid}`, params);

    // Récupérer le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      console.error("Aucun token d'authentification disponible");
      return null;
    }

    // Effectuer la requête API
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      return null;
    }

    // Traiter la réponse
    const data = await response.json();

    if (data && data.campaign) {
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
    console.error(`Erreur lors de la récupération de la campagne ${uid}:`, error);
    return null;
  }
};

/**
 * Force la synchronisation des campagnes pour un compte
 * Amélioré avec des en-têtes d'authentification explicites
 */
export const forceSyncCampaigns = async (
  account: AcelleAccount,
  accessToken: string,
  additionalHeaders?: Record<string, string>
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!account?.id) {
      return { success: false, message: "Aucun compte spécifié" };
    }

    if (!accessToken) {
      return { success: false, message: "Token d'authentification manquant" };
    }
    
    if (!account.api_token || !account.api_endpoint) {
      return { 
        success: false, 
        message: "Informations d'API incomplètes. Vérifiez les paramètres du compte." 
      };
    }

    console.log(`Forçage de la synchronisation des campagnes pour le compte ${account.name}`);

    // En-têtes de base
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Ajouter les en-têtes d'authentification Acelle si fournis
    if (additionalHeaders) {
      Object.keys(additionalHeaders).forEach(key => {
        headers[key] = additionalHeaders[key];
      });
    } else {
      // Sinon, utiliser les valeurs du compte
      headers['X-Acelle-Token'] = account.api_token;
      headers['X-Acelle-Endpoint'] = account.api_endpoint;
    }

    // Appeler la fonction Edge pour synchroniser
    const { data, error } = await supabase.functions.invoke('sync-email-campaigns', {
      method: 'POST',
      headers,
      body: { 
        accountId: account.id
      }
    });
    
    console.log("Réponse de synchronisation:", { data, error });
    
    if (error) {
      // Amélioration de la gestion d'erreur
      let errorMessage = error.message;
      
      // Détecter spécifiquement les erreurs d'authentification
      if (error.message.includes("403") || error.message.includes("Forbidden")) {
        errorMessage = "Erreur d'authentification à l'API Acelle (403 Forbidden). Vérifiez les identifiants API.";
      }
      
      console.error("Erreur lors de la synchronisation:", errorMessage);
      return { 
        success: false, 
        message: errorMessage
      };
    }

    // Traiter la réponse
    if (data?.success) {
      return { 
        success: true, 
        message: data.message || "Synchronisation réussie" 
      };
    } else if (data?.error) {
      // Amélioration de la gestion des erreurs renvoyées par l'API
      let errorMessage = data.error;
      
      // Détecter spécifiquement les erreurs d'authentification
      if (data.statusCode === 403 || 
          (typeof data.error === 'string' && (
           data.error.includes("403") || 
           data.error.includes("Forbidden") || 
           data.error.includes("authentification") || 
           data.error.includes("authentication")))) {
        errorMessage = "Erreur d'authentification à l'API Acelle. Vérifiez les identifiants API.";
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    } else {
      return { 
        success: false, 
        message: "La synchronisation a échoué pour une raison inconnue" 
      };
    }
  } catch (error) {
    console.error("Erreur lors de la synchronisation forcée:", error);
    
    // Amélioration de la détection des erreurs d'authentification
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("403") || errorMessage.includes("Forbidden") || 
        errorMessage.includes("authentification") || errorMessage.includes("authentication")) {
      return { 
        success: false, 
        message: "Erreur d'authentification à l'API Acelle. Vérifiez les identifiants API."
      };
    }
    
    return { 
      success: false, 
      message: `Erreur: ${errorMessage}` 
    };
  }
};

/**
 * Extraire les campagnes du cache par le compte
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

    console.log(`Extraction des campagnes en cache pour le compte ${accountId}, page ${page}`);

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

    console.log(`${campaigns.length} campagnes extraites du cache`);
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
