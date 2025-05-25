import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildDirectAcelleApiUrl } from "../acelle-service";
import { createEmptyStatistics } from "@/utils/acelle/campaignStats";

/**
 * Récupère les campagnes d'un compte Acelle depuis l'API directement
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

    // Construction de l'URL directe
    const url = buildDirectAcelleApiUrl("campaigns", account.api_endpoint, params);
    console.log(`Requesting campaigns directly from Acelle API: ${url.replace(account.api_token, '***')}`);

    // Effectuer la requête API directe
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-account-id': account.id,
        'x-acelle-token': account.api_token,
        'Origin': window.location.origin
      }
    });

    if (!response.ok) {
      console.error(`Erreur API directe: ${response.status} ${response.statusText}`);
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
 * Récupère une campagne spécifique par son UID directement depuis l'API
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

    // Construction de l'URL directe
    const url = buildDirectAcelleApiUrl(`campaigns/${uid}`, account.api_endpoint, params);

    // Effectuer la requête API directe
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-account-id': account.id,
        'x-acelle-token': account.api_token,
        'Origin': window.location.origin
      }
    });

    if (!response.ok) {
      console.error(`Erreur API directe: ${response.status} ${response.statusText}`);
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
 * Note: Cette fonction est maintenant simplifiée car nous n'utilisons plus les Edge functions
 */
export const forceSyncCampaigns = async (
  account: AcelleAccount,
  accessToken?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!account?.id) {
      return { success: false, message: "Aucun compte spécifié" };
    }

    console.log(`Synchronisation directe des campagnes pour le compte ${account.name}`);

    // Récupérer directement les campagnes depuis l'API
    const campaigns = await getCampaigns(account, { page: 1, perPage: 50 });
    
    if (campaigns.length > 0) {
      // Optionnellement, mettre en cache les campagnes récupérées
      try {
        await Promise.all(campaigns.map(async (campaign) => {
          const { error } = await supabase
            .from('email_campaigns_cache')
            .upsert({
              account_id: account.id,
              campaign_uid: campaign.uid,
              name: campaign.name,
              subject: campaign.subject,
              status: campaign.status,
              created_at: campaign.created_at,
              updated_at: campaign.updated_at,
              delivery_date: campaign.delivery_date,
              run_at: campaign.run_at,
              last_error: campaign.last_error,
              delivery_info: campaign.delivery_info,
              cache_updated_at: new Date().toISOString()
            }, {
              onConflict: 'account_id,campaign_uid'
            });
          
          if (error) {
            console.error(`Erreur lors de la mise en cache de la campagne ${campaign.uid}:`, error);
          }
        }));
      } catch (cacheError) {
        console.warn("Erreur lors de la mise en cache, mais synchronisation réussie:", cacheError);
      }
      
      return { 
        success: true, 
        message: `${campaigns.length} campagnes synchronisées avec succès` 
      };
    } else {
      return { 
        success: false, 
        message: "Aucune campagne trouvée ou erreur lors de la récupération" 
      };
    }
  } catch (error) {
    console.error("Erreur lors de la synchronisation directe:", error);
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : "Échec de la synchronisation"}` 
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
