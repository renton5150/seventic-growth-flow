
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { buildCorsProxyUrl, buildCorsProxyHeaders } from "../cors-proxy";
import { supabase } from "@/integrations/supabase/client";
import { enrichCampaignsWithStats } from "./directStats";
import { toast } from "sonner";

/**
 * Récupère les campagnes depuis l'API Acelle
 */
export const getAcelleCampaigns = async (
  account: AcelleAccount,
  options?: { 
    refresh?: boolean;
  }
): Promise<AcelleCampaign[]> => {
  try {
    console.log(`Récupération des campagnes pour ${account.name}...`);
    
    // Si pas de rafraîchissement demandé, essayer d'abord depuis le cache
    if (!options?.refresh) {
      const { data: cachedCampaigns, error: cacheError } = await supabase
        .from('email_campaigns_cache')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false });
      
      if (!cacheError && cachedCampaigns && cachedCampaigns.length > 0) {
        console.log(`${cachedCampaigns.length} campagnes récupérées depuis le cache`);
        
        // Transformer les données du cache en objets AcelleCampaign
        const transformedCampaigns: AcelleCampaign[] = cachedCampaigns.map(item => ({
          uid: item.campaign_uid,
          campaign_uid: item.campaign_uid,
          name: item.name || "Sans nom",
          subject: item.subject || "",
          status: item.status || "unknown",
          created_at: item.created_at,
          updated_at: item.updated_at,
          delivery_date: item.delivery_date,
          run_at: item.run_at,
          delivery_info: typeof item.delivery_info === 'string' 
            ? JSON.parse(item.delivery_info) 
            : (item.delivery_info || {}),
          last_error: item.last_error
        }));
        
        // Enrichir avec des statistiques
        const enrichedCampaigns = await enrichCampaignsWithStats(transformedCampaigns, account);
        return enrichedCampaigns;
      }
    }
    
    // Récupérer depuis l'API si pas de cache ou rafraîchissement demandé
    const apiPath = 'campaigns';
    const url = buildCorsProxyUrl(apiPath);
    
    console.log(`Récupération des campagnes depuis l'API via CORS proxy: ${url}`);
    
    // Appel CORS Proxy
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      throw new Error("Token d'authentification non disponible");
    }
    
    const headers = buildCorsProxyHeaders(account, {
      'Authorization': `Bearer ${token}`
    });
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des campagnes: ${response.status} ${response.statusText}`);
    }
    
    const apiResponse = await response.json();
    
    // Vérifier que nous recevons bien un tableau dans la réponse
    if (!Array.isArray(apiResponse)) {
      console.error("Format de réponse inattendu:", apiResponse);
      throw new Error("Format de réponse API inattendu: la réponse n'est pas un tableau");
    }
    
    const campaigns: AcelleCampaign[] = apiResponse.map((campaign: any) => ({
      uid: campaign.uid,
      campaign_uid: campaign.uid,
      name: campaign.name || "Sans nom",
      subject: campaign.subject || "",
      status: campaign.status || "unknown",
      created_at: campaign.created_at || new Date().toISOString(),
      updated_at: campaign.updated_at || new Date().toISOString(),
      delivery_date: campaign.delivery_date,
      run_at: campaign.run_at
    }));
    
    console.log(`${campaigns.length} campagnes récupérées depuis l'API`);
    
    // Mettre à jour le cache
    try {
      for (const campaign of campaigns) {
        await supabase
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
            cache_updated_at: new Date().toISOString()
          }, {
            onConflict: 'account_id,campaign_uid'
          });
      }
      console.log(`${campaigns.length} campagnes mises en cache`);
    } catch (cacheError) {
      console.error("Erreur lors de la mise à jour du cache:", cacheError);
    }
    
    // Enrichir les campagnes avec des statistiques
    const enrichedCampaigns = await enrichCampaignsWithStats(campaigns, account);
    
    return enrichedCampaigns;
  } catch (error) {
    console.error(`Erreur lors de la récupération des campagnes pour ${account.name}:`, error);
    throw error;
  }
};

/**
 * Extrait les campagnes depuis le cache Supabase
 * Cette fonction est exportée pour être utilisée par d'autres modules
 */
export const extractCampaignsFromCache = async (
  accounts: AcelleAccount[],
  page: number = 1,
  pageSize: number = 10
): Promise<AcelleCampaign[]> => {
  if (!accounts || accounts.length === 0) {
    console.log("Aucun compte fourni pour l'extraction du cache");
    return [];
  }

  try {
    const accountIds = accounts.map(account => account.id);
    
    // Calculer l'offset pour la pagination
    const offset = (page - 1) * pageSize;
    
    // Récupérer les campagnes mises en cache
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transformer les données en AcelleCampaign[]
    const campaigns = data.map(item => ({
      uid: item.campaign_uid,
      campaign_uid: item.campaign_uid,
      name: item.name || '',
      subject: item.subject || '',
      status: item.status || '',
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      delivery_date: item.delivery_date || '',
      run_at: item.run_at || '',
      delivery_info: typeof item.delivery_info === 'string' 
        ? JSON.parse(item.delivery_info) 
        : (item.delivery_info || {}),
      last_error: item.last_error
    })) as AcelleCampaign[];
    
    return campaigns;
  } catch (error) {
    console.error("Erreur lors de l'extraction des campagnes du cache:", error);
    return [];
  }
};

/**
 * Fonction pour obtenir le statut du cache
 */
export const getCacheStatus = async (accountId: string): Promise<{
  count: number;
  lastUpdated: string | null;
  hasData: boolean;
}> => {
  try {
    const { data, error } = await supabase
      .from('email_campaigns_cache')
      .select('cache_updated_at')
      .eq('account_id', accountId)
      .order('cache_updated_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return { count: 0, lastUpdated: null, hasData: false };
    }
    
    // Compter le nombre total d'entrées pour ce compte
    const { count, error: countError } = await supabase
      .from('email_campaigns_cache')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);
    
    if (countError) {
      return { count: 0, lastUpdated: data[0].cache_updated_at, hasData: true };
    }
    
    return {
      count: count || 0,
      lastUpdated: data[0].cache_updated_at,
      hasData: true
    };
  } catch (error) {
    console.error("Erreur lors de la vérification du statut du cache:", error);
    return { count: 0, lastUpdated: null, hasData: false };
  }
};

/**
 * Récupère les détails d'une campagne spécifique
 */
export const getAcelleCampaignDetails = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaign | null> => {
  try {
    console.log(`Récupération des détails pour la campagne ${campaignUid}`);
    
    // D'abord, essayons de récupérer les détails depuis le cache
    const { data: cachedCampaign, error: cacheError } = await supabase
      .from('email_campaigns_cache')
      .select('*')
      .eq('account_id', account.id)
      .eq('campaign_uid', campaignUid)
      .single();
    
    if (!cacheError && cachedCampaign) {
      console.log(`Détails de la campagne ${campaignUid} récupérés depuis le cache`);
      
      // Transformer les données du cache
      const campaign: AcelleCampaign = {
        uid: cachedCampaign.campaign_uid,
        campaign_uid: cachedCampaign.campaign_uid,
        name: cachedCampaign.name,
        subject: cachedCampaign.subject,
        status: cachedCampaign.status,
        created_at: cachedCampaign.created_at,
        updated_at: cachedCampaign.updated_at,
        delivery_date: cachedCampaign.delivery_date,
        run_at: cachedCampaign.run_at,
        delivery_info: typeof cachedCampaign.delivery_info === 'string'
          ? JSON.parse(cachedCampaign.delivery_info)
          : (cachedCampaign.delivery_info || {})
      };
      
      // Enrichir avec des statistiques à jour
      const enrichedCampaign = await enrichCampaignsWithStats([campaign], account, { forceRefresh: true });
      return enrichedCampaign[0];
    }
    
    // Si aucune campagne trouvée dans le cache, récupérer depuis l'API
    const apiPath = `campaigns/${campaignUid}`;
    const url = buildCorsProxyUrl(apiPath);
    
    // Obtenir le token d'authentification
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      throw new Error("Token d'authentification non disponible");
    }
    
    // Construire les en-têtes pour la requête
    const headers = buildCorsProxyHeaders(account, {
      'Authorization': `Bearer ${token}`
    });
    
    console.log(`Récupération des détails de la campagne ${campaignUid} depuis l'API via CORS proxy`);
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des détails de la campagne: ${response.status} ${response.statusText}`);
    }
    
    const apiResponse = await response.json();
    
    if (!apiResponse || !apiResponse.uid) {
      throw new Error("Format de réponse API inattendu pour les détails de la campagne");
    }
    
    // Transformer les données de l'API
    const campaign: AcelleCampaign = {
      uid: apiResponse.uid,
      campaign_uid: apiResponse.uid,
      name: apiResponse.name,
      subject: apiResponse.subject,
      status: apiResponse.status,
      created_at: apiResponse.created_at,
      updated_at: apiResponse.updated_at,
      delivery_date: apiResponse.delivery_date,
      run_at: apiResponse.run_at
    };
    
    // Mettre à jour le cache
    await supabase
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
        cache_updated_at: new Date().toISOString()
      }, {
        onConflict: 'account_id,campaign_uid'
      });
    
    // Enrichir avec des statistiques
    const enrichedCampaign = await enrichCampaignsWithStats([campaign], account);
    return enrichedCampaign[0];
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails de la campagne ${campaignUid}:`, error);
    return null;
  }
};

/**
 * Force la synchronisation des campagnes avec l'API Acelle
 */
export const forceSyncCampaigns = async (
  account: AcelleAccount,
  authToken: string
): Promise<{success: boolean, message: string}> => {
  try {
    console.log(`Synchronisation forcée des campagnes pour ${account.name}...`);
    
    // Appeler la fonction Edge pour synchroniser les campagnes
    const response = await fetch(`https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        accountId: account.id
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la synchronisation: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      message: "Synchronisation des campagnes réussie"
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation forcée:", error);
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : "Erreur de synchronisation"}`
    };
  }
};
