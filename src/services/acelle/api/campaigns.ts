
import { AcelleCampaign, DeliveryInfo } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère toutes les campagnes d'un compte Acelle
 */
export const getCampaigns = async (): Promise<AcelleCampaign[]> => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erreur lors de la récupération des campagnes Acelle:", error);
      return [];
    }
    
    return data?.map(campaign => ({
      uid: campaign.campaign_uid, // Ajout du champ uid requis par AcelleCampaign
      campaign_uid: campaign.campaign_uid,
      name: campaign.name || '',
      subject: campaign.subject || '',
      status: campaign.status || '',
      created_at: campaign.created_at || '',
      updated_at: campaign.updated_at || '',
      delivery_date: campaign.delivery_date || null,
      run_at: campaign.run_at || null,
      last_error: campaign.last_error || null,
      delivery_info: parseDeliveryInfo(campaign.delivery_info)
    })) || [];
  } catch (error) {
    console.error("Exception lors de la récupération des campagnes Acelle:", error);
    return [];
  }
};

/**
 * Récupère une campagne Acelle par son UID
 */
export const getCampaign = async (uid: string): Promise<AcelleCampaign | null> => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('campaign_uid', uid)
      .single();
    
    if (error) {
      console.error("Erreur lors de la récupération de la campagne Acelle:", error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      uid: data.campaign_uid, // Ajout du champ uid requis par AcelleCampaign
      campaign_uid: data.campaign_uid,
      name: data.name || '',
      subject: data.subject || '',
      status: data.status || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      delivery_date: data.delivery_date || null,
      run_at: data.run_at || null,
      last_error: data.last_error || null,
      delivery_info: parseDeliveryInfo(data.delivery_info)
    };
  } catch (error) {
    console.error("Exception lors de la récupération de la campagne Acelle:", error);
    return null;
  }
};

/**
 * Force la synchronisation des campagnes depuis Acelle
 */
export const forceSyncCampaigns = async (account: any): Promise<{ success: boolean; message: string; error?: string }> => {
  try {
    console.log("Démarrage de la synchronisation forcée pour le compte:", account.id);
    
    if (!account?.id || !account?.api_endpoint || !account?.api_token) {
      console.error("Informations de compte incomplètes pour la synchronisation forcée");
      return { 
        success: false, 
        message: "Informations de compte incomplètes", 
        error: "Identifiants API manquants" 
      };
    }
    
    // Récupérer le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      console.error("Aucun token d'authentification disponible");
      return { 
        success: false, 
        message: "Erreur d'authentification", 
        error: "Token d'authentification non disponible" 
      };
    }
    
    console.log("Appel de la fonction Edge pour synchroniser les campagnes");
    
    // Appeler la fonction edge pour synchroniser
    const { data, error } = await supabase.functions.invoke('sync-email-campaigns', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Acelle-Token': account.api_token,
        'X-Acelle-Endpoint': account.api_endpoint,
        'X-Debug-Level': '3' // Niveau DEBUG pour obtenir plus d'informations
      },
      body: { 
        accountId: account.id,
        apiToken: account.api_token,
        apiEndpoint: account.api_endpoint,
        authMethod: 'token'
      }
    });
    
    if (error) {
      console.error("Erreur lors de l'appel à la fonction de synchronisation:", error);
      return { 
        success: false, 
        message: `Erreur lors de l'appel à la fonction de synchronisation: ${error.message}`, 
        error: error.message 
      };
    }
    
    if (data?.error) {
      console.error("Erreur retournée par la fonction de synchronisation:", data.error);
      return { 
        success: false, 
        message: `Erreur de synchronisation: ${data.error}`, 
        error: data.error 
      };
    }
    
    console.log("Résultat de la synchronisation:", data);
    
    return { 
      success: data?.success || false, 
      message: data?.message || "Synchronisation terminée" 
    };
  } catch (error) {
    console.error("Exception lors de la synchronisation forcée des campagnes:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: errorMessage, error: errorMessage };
  }
};

// Fonction utilitaire pour convertir les données JSON en type DeliveryInfo
function parseDeliveryInfo(data: any): DeliveryInfo {
  if (!data) return {} as DeliveryInfo;
  
  try {
    // Si les données sont une chaîne, essayer de les parser
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.warn("Erreur parsing delivery_info string:", e);
        return {} as DeliveryInfo;
      }
    }

    // Assurer que c'est un objet
    if (typeof data !== 'object') {
      return {} as DeliveryInfo;
    }

    // Gérer le cas où bounced est un nombre
    if (typeof data.bounced === 'number') {
      data = {
        ...data,
        bounced: {
          total: data.bounced,
          soft: data.soft_bounce_count || 0,
          hard: data.hard_bounce_count || 0
        }
      };
    }
    
    return data as DeliveryInfo;
  } catch (e) {
    console.error("Erreur lors du traitement de delivery_info:", e);
    return {} as DeliveryInfo;
  }
}

// Ajouter ces fonctions pour corriger les imports dans useAcelleCampaigns.ts
export const extractCampaignsFromCache = async (accountId: string, options?: any) => {
  console.log("Extracting campaigns from cache for account", accountId);
  
  try {
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erreur lors de l'extraction des campagnes du cache:", error);
      return [];
    }
    
    return data?.map(campaign => ({
      uid: campaign.campaign_uid,
      campaign_uid: campaign.campaign_uid,
      name: campaign.name || '',
      subject: campaign.subject || '',
      status: campaign.status || '',
      created_at: campaign.created_at || '',
      updated_at: campaign.updated_at || '',
      delivery_date: campaign.delivery_date || null,
      run_at: campaign.run_at || null,
      last_error: campaign.last_error || null,
      delivery_info: parseDeliveryInfo(campaign.delivery_info)
    })) || [];
  } catch (error) {
    console.error("Exception lors de l'extraction des campagnes du cache:", error);
    return [];
  }
};

// Fonction pour obtenir le statut du cache
export const getCacheStatus = async (accountId: string) => {
  try {
    // Get last updated timestamp
    const { data: lastUpdatedData, error: lastUpdatedError } = await supabase
      .from('email_campaigns_cache')
      .select('cache_updated_at')
      .eq('account_id', accountId)
      .order('cache_updated_at', { ascending: false })
      .limit(1)
      .single();
      
    // Get count
    const { count, error: countError } = await supabase
      .from('email_campaigns_cache')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);
      
    if (lastUpdatedError && lastUpdatedError.code !== 'PGRST116') {
      console.error("Erreur lors de la récupération du timestamp:", lastUpdatedError);
    }
    
    if (countError) {
      console.error("Erreur lors du comptage des campagnes:", countError);
    }
    
    return {
      lastUpdated: lastUpdatedData?.cache_updated_at || null,
      count: count || 0
    };
  } catch (error) {
    console.error("Exception lors de la récupération du statut du cache:", error);
    return { lastUpdated: null, count: 0 };
  }
};
