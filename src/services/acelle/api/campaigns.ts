
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { buildProxyUrl } from "../acelle-service";
import { supabase } from "@/integrations/supabase/client";
import { enrichCampaignsWithStats } from "./directStats";
import { toast } from "sonner";

/**
 * Récupère les campagnes depuis l'API Acelle
 */
export const getAcelleCampaigns = async (
  account: AcelleAccount,
  options?: { refresh?: boolean; demoMode?: boolean; }
): Promise<AcelleCampaign[]> => {
  try {
    console.log(`Récupération des campagnes pour ${account.name}...`);
    
    // Si le mode démo est activé, générer des campagnes fictives
    if (options?.demoMode) {
      const { data: mockCampaigns } = await supabase.rpc('generate_mock_campaigns', { count: 10 });
      return mockCampaigns || [];
    }
    
    // Si pas de rafraîchissement demandé, essayer d'abord depuis le cache
    if (!options?.refresh) {
      const { data: cachedCampaigns, error: cacheError } = await supabase
        .from('email_campaigns_cache')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false });
      
      if (!cacheError && cachedCampaigns && cachedCampaigns.length > 0) {
        console.log(`${cachedCampaigns.length} campagnes récupérées depuis le cache`);
        
        // Enrichir avec des statistiques
        const enrichedCampaigns = await enrichCampaignsWithStats(cachedCampaigns, account);
        return enrichedCampaigns;
      }
    }
    
    // Récupérer depuis l'API si pas de cache ou rafraîchissement demandé
    const params = {
      api_token: account.api_token,
      sort_order: 'desc',
      _t: Date.now().toString() // Anti-cache
    };
    
    const url = buildProxyUrl('campaigns', params);
    
    console.log(`Récupération des campagnes depuis l'API...`);
    
    // Appel CORS Proxy
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      throw new Error("Token d'authentification non disponible");
    }
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des campagnes: ${response.status} ${response.statusText}`);
    }
    
    const apiResponse = await response.json();
    
    if (!apiResponse.data) {
      throw new Error("Format de réponse API inattendu");
    }
    
    const campaigns: AcelleCampaign[] = apiResponse.data.map((campaign: any) => ({
      uid: campaign.uid,
      campaign_uid: campaign.uid,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
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
 * Récupère les détails d'une campagne spécifique
 */
export const getAcelleCampaignDetails = async (
  campaignUid: string,
  account: AcelleAccount,
  options?: { refresh?: boolean; demoMode?: boolean; }
): Promise<any> => {
  try {
    console.log(`Récupération des détails de la campagne ${campaignUid}...`);
    
    // Si mode démo, générer un détail fictif
    if (options?.demoMode) {
      return {
        uid: campaignUid,
        name: `Campagne démo ${campaignUid}`,
        subject: `Sujet de la campagne ${campaignUid}`,
        status: "sent",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delivery_date: new Date().toISOString(),
        content: "<p>Contenu de démonstration de la campagne</p>",
        html: "<html><body><p>Contenu HTML de démonstration</p></body></html>"
      };
    }
    
    const params = {
      api_token: account.api_token,
      _t: Date.now().toString() // Anti-cache
    };
    
    const url = buildProxyUrl(`campaigns/${campaignUid}`, params);
    
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      throw new Error("Token d'authentification non disponible");
    }
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des détails de la campagne: ${response.status} ${response.statusText}`);
    }
    
    const campaignDetails = await response.json();
    
    return campaignDetails;
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails de la campagne ${campaignUid}:`, error);
    throw error;
  }
};

/**
 * Force la synchronisation des campagnes pour un compte
 */
export const forceSyncCampaigns = async (
  account: AcelleAccount,
  authToken: string
): Promise<{ success: boolean; message: string }> => {
  console.log(`Synchronisation forcée des campagnes pour ${account.name}...`);
  
  try {
    if (!account || !account.id || !account.api_token || !account.api_endpoint) {
      return {
        success: false,
        message: "Informations de compte incomplètes"
      };
    }
    
    if (!authToken) {
      return {
        success: false,
        message: "Token d'authentification manquant"
      };
    }
    
    // Appeler l'API pour récupérer les campagnes
    const params = {
      api_token: account.api_token,
      sort_order: 'desc',
      _t: Date.now().toString() // Anti-cache
    };
    
    const url = buildProxyUrl('campaigns', params);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      console.error(`Erreur API lors de la sync: ${response.status} ${response.statusText}`);
      return {
        success: false,
        message: `Erreur API: ${response.status} ${response.statusText}`
      };
    }
    
    const apiResponse = await response.json();
    
    if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
      return {
        success: false,
        message: "Format de réponse API inattendu"
      };
    }
    
    // Transformer les données
    const campaigns = apiResponse.data.map((campaign: any) => ({
      uid: campaign.uid,
      campaign_uid: campaign.uid,
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      delivery_date: campaign.delivery_date,
      run_at: campaign.run_at
    }));
    
    // Vider le cache existant pour ce compte
    await supabase
      .from('email_campaigns_cache')
      .delete()
      .eq('account_id', account.id);
    
    // Mise à jour du cache
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
    
    // Mise à jour de la date de synchronisation du compte
    await supabase
      .from('acelle_accounts')
      .update({ 
        last_sync_date: new Date().toISOString(),
        last_sync_error: null
      })
      .eq('id', account.id);
    
    return {
      success: true,
      message: `${campaigns.length} campagnes synchronisées avec succès`
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation forcée:", error);
    
    // Stocker l'erreur dans la base de données
    try {
      await supabase
        .from('acelle_accounts')
        .update({ 
          last_sync_error: error instanceof Error ? error.message : String(error),
          last_sync_date: new Date().toISOString()
        })
        .eq('id', account.id);
    } catch (dbError) {
      console.error("Erreur lors de l'enregistrement de l'erreur:", dbError);
    }
    
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
