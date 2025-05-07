import { AcelleAccount, AcelleCampaign, CachedCampaign } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";
import { buildProxyUrl } from "../acelle-service";
import { wakeupCorsProxy, getAuthToken, fetchViaProxy } from "../cors-proxy";
import { toast } from "sonner";

/**
 * Récupère les campagnes d'un compte Acelle avec gestion améliorée des erreurs
 */
export async function getAcelleCampaigns(
  account: AcelleAccount,
  options?: {
    refresh?: boolean;
    maxRetries?: number;
  }
): Promise<AcelleCampaign[]> {
  const maxRetries = options?.maxRetries || 1;
  
  try {
    console.log(`Récupération des campagnes pour le compte ${account.name}`);
    
    // Si refresh n'est pas demandé, on essaie d'abord le cache
    if (!options?.refresh) {
      const cachedCampaigns = await getCampaignsFromCache(account.id);
      
      if (cachedCampaigns && cachedCampaigns.length > 0) {
        console.log(`Retour de ${cachedCampaigns.length} campagnes depuis le cache pour ${account.name}`);
        return convertCacheToAcelleCampaigns(cachedCampaigns);
      }
    }
    
    // Si pas de cache ou refresh demandé, on va chercher les campagnes via l'API
    if (!account.api_endpoint || !account.api_token) {
      console.error(`Impossible d'appeler l'API: configuration API manquante pour ${account.name}`);
      throw new Error("Configuration API incomplète pour ce compte");
    }

    // Obtenir un token d'authentification à jour
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error("Token d'authentification non disponible");
    }
    
    // Réveiller le proxy CORS
    const proxyReady = await wakeupCorsProxy(authToken);
    if (!proxyReady) {
      console.error("Le proxy CORS n'a pas pu être réveillé");
      throw new Error("Le proxy CORS n'est pas disponible");
    }
    
    // Récupérer depuis l'API avec gestion des erreurs
    console.log(`Récupération des campagnes depuis l'API pour ${account.name}`);
    
    try {
      // Utiliser fetchViaProxy qui gère les retries et l'authentification
      const response = await fetchViaProxy(
        "campaigns?page=1&per_page=100",
        { method: "GET" },
        account.api_token,
        account.api_endpoint,
        maxRetries
      );
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error(`Format de réponse API inattendu: pas un tableau`, data);
        throw new Error(`Format de réponse API inattendu`);
      }
      
      console.log(`API a retourné ${data.length} campagnes pour ${account.name}`);
      
      // Convertir les données en AcelleCampaign[]
      const campaigns: AcelleCampaign[] = data.map(item => ({
        uid: item.uid,
        campaign_uid: item.uid,
        name: item.name || '',
        subject: item.subject || '',
        status: item.status || '',
        created_at: item.created_at || '',
        updated_at: item.updated_at || '',
        delivery_date: item.run_at || item.delivery_at || '',
        run_at: item.run_at || '',
        last_error: item.last_error || '',
      }));
      
      // Mettre à jour le cache avec les nouvelles données
      await updateCampaignsCache(campaigns, account.id);
      
      return campaigns;
    } catch (apiError) {
      console.error(`Erreur API lors de la récupération des campagnes:`, apiError);
      
      // Si une erreur se produit mais qu'on a des données en cache, utiliser le cache
      const cachedCampaigns = await getCampaignsFromCache(account.id);
      if (cachedCampaigns && cachedCampaigns.length > 0) {
        console.log(`Utilisation du cache après échec API (${cachedCampaigns.length} campagnes)`);
        toast.error(`Erreur de connexion à l'API: utilisation des données en cache`);
        return convertCacheToAcelleCampaigns(cachedCampaigns);
      }
      
      // Si pas de cache, propager l'erreur
      throw apiError;
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des campagnes:`, error);
    throw error;
  }
}

/**
 * Récupère le statut du cache pour un compte
 */
export async function getCacheStatus(accountId: string): Promise<{
  count: number;
  lastUpdated: string | null;
}> {
  try {
    const { count } = await supabase
      .from('email_campaigns_cache')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);
    
    const { data } = await supabase
      .from('email_campaigns_cache')
      .select('cache_updated_at')
      .eq('account_id', accountId)
      .order('cache_updated_at', { ascending: false })
      .limit(1)
      .single();
    
    return {
      count: count || 0,
      lastUpdated: data?.cache_updated_at || null
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération du statut du cache:`, error);
    return {
      count: 0,
      lastUpdated: null
    };
  }
}

/**
 * Récupère les campagnes depuis le cache
 */
async function getCampaignsFromCache(accountId: string): Promise<CachedCampaign[]> {
  try {
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data as CachedCampaign[];
  } catch (error) {
    console.error(`Erreur lors de la récupération des campagnes depuis le cache:`, error);
    return [];
  }
}

/**
 * Convertit les données du cache en AcelleCampaign[]
 */
function convertCacheToAcelleCampaigns(cachedCampaigns: CachedCampaign[]): AcelleCampaign[] {
  return cachedCampaigns.map(item => {
    // Traitement des delivery_info
    let deliveryInfo = {};
    
    if (item.delivery_info) {
      if (typeof item.delivery_info === 'string') {
        try {
          deliveryInfo = JSON.parse(item.delivery_info);
        } catch (e) {
          console.warn(`Erreur lors du parsing de delivery_info pour ${item.campaign_uid}:`, e);
        }
      } else {
        deliveryInfo = item.delivery_info;
      }
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
      delivery_info: deliveryInfo
    };
  });
}

/**
 * Met à jour le cache des campagnes
 */
async function updateCampaignsCache(campaigns: AcelleCampaign[], accountId: string): Promise<void> {
  try {
    if (campaigns.length === 0) {
      return;
    }
    
    console.log(`Mise à jour du cache avec ${campaigns.length} campagnes`);
    
    // Format de données pour l'upsert
    const cacheData = campaigns.map(campaign => ({
      campaign_uid: campaign.uid,
      account_id: accountId,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      delivery_date: campaign.delivery_date,
      run_at: campaign.run_at,
      last_error: campaign.last_error,
      cache_updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('email_campaigns_cache')
      .upsert(cacheData, {
        onConflict: 'campaign_uid',
        ignoreDuplicates: false
      });
    
    if (error) {
      throw error;
    }
    
    console.log(`Cache mis à jour avec succès`);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du cache:`, error);
  }
}

/**
 * Fonction pour forcer la synchronisation des campagnes avec gestion améliorée des erreurs
 */
export async function forceSyncCampaigns(
  account: AcelleAccount,
  authToken: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log(`Forçage de la synchronisation des campagnes pour ${account.name}`);
    
    // Réveiller le proxy CORS
    const proxyReady = await wakeupCorsProxy(authToken);
    if (!proxyReady) {
      return {
        success: false,
        message: "Impossible de réveiller le proxy CORS"
      };
    }
    
    // Synchronisation directe via l'API
    const campaigns = await getAcelleCampaigns(account, { 
      refresh: true,
      maxRetries: 2 // Plus de tentatives pour la synchro forcée
    });
    
    console.log(`Synchronisation réussie de ${campaigns.length} campagnes`);
    
    return {
      success: true,
      message: `${campaigns.length} campagnes synchronisées avec succès.`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Erreur lors de la synchronisation:`, error);
    
    return {
      success: false,
      message: `Échec de la synchronisation: ${errorMessage}`
    };
  }
}

// Function to add wakeupCorsProxy if needed
export function wakeupCorsProxy() {
  console.log("Fonction wakeupCorsProxy appelée depuis campaigns.ts");
  // Implementation will be in cors-proxy.ts
}
