
import { AcelleAccount, AcelleCampaign } from "@/types/acelle.types";
import { buildProxyUrl } from "../acelle-service";
import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère toutes les campagnes pour un compte Acelle
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
      console.error("Informations de compte invalides pour la récupération des campagnes");
      return [];
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      console.error("Pas de token d'accès disponible pour l'appel API");
      return [];
    }

    // Paramètres par défaut pour la pagination
    const page = options?.page || 1;
    const perPage = options?.perPage || 25;

    // Construire l'URL pour la récupération des campagnes
    const endpoint = "campaigns";
    const params = {
      api_token: account.api_token,
      page: page.toString(),
      per_page: perPage.toString(),
    };

    const url = buildProxyUrl(endpoint, params);

    console.log(`Fetching campaigns from: ${url}`);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.data)) {
      console.error("Format de réponse inattendu:", data);
      return [];
    }

    // Mapper les données API au format interne
    const campaigns: AcelleCampaign[] = data.data.map((item: any) => ({
      uid: item.uid,
      name: item.name || "Sans nom",
      subject: item.subject || "Sans sujet",
      status: item.status || "unknown",
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      delivery_date: item.delivery_at || item.run_at || null,
      run_at: item.run_at || null,
      last_error: item.last_error || null,
      delivery_info: item.delivery_info || {},
      statistics: item.statistics || null,
    }));

    return campaigns;
  } catch (error) {
    console.error("Erreur lors de la récupération des campagnes:", error);
    return [];
  }
};

/**
 * Récupère une campagne spécifique par son UID
 */
export const getCampaign = async (
  campaignUid: string,
  account: AcelleAccount
): Promise<AcelleCampaign | null> => {
  try {
    if (!account || !account.api_token || !account.api_endpoint) {
      console.error("Informations de compte invalides pour la récupération de la campagne");
      return null;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      console.error("Pas de token d'accès disponible pour l'appel API");
      return null;
    }

    // Construire l'URL pour la récupération de la campagne
    const endpoint = `campaigns/${campaignUid}`;
    const params = { api_token: account.api_token };
    const url = buildProxyUrl(endpoint, params);

    console.log(`Fetching campaign: ${url}`);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data || !data.campaign) {
      console.error("Format de réponse inattendu:", data);
      return null;
    }

    // Mapper les données API au format interne
    const campaign: AcelleCampaign = {
      uid: data.campaign.uid,
      name: data.campaign.name || "Sans nom",
      subject: data.campaign.subject || "Sans sujet",
      status: data.campaign.status || "unknown",
      created_at: data.campaign.created_at || new Date().toISOString(),
      updated_at: data.campaign.updated_at || new Date().toISOString(),
      delivery_date: data.campaign.delivery_at || data.campaign.run_at || null,
      run_at: data.campaign.run_at || null,
      last_error: data.campaign.last_error || null,
      delivery_info: data.delivery_info || {},
      statistics: data.statistics || null,
    };

    return campaign;
  } catch (error) {
    console.error("Erreur lors de la récupération de la campagne:", error);
    return null;
  }
};

/**
 * Force la synchronisation des campagnes
 */
export const forceSyncCampaigns = async (
  account: AcelleAccount,
  accessToken: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!account || !account.id) {
      return { success: false, message: "Compte invalide pour la synchronisation" };
    }

    if (!accessToken) {
      return { success: false, message: "Token d'accès manquant pour la synchronisation" };
    }

    // Appeler la fonction Edge pour synchroniser les campagnes
    const syncUrl = '/api/functions/v1/sync-email-campaigns';
    
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ 
        accountId: account.id,
        forceSync: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `Erreur lors de la synchronisation: ${response.status} ${errorText}`
      };
    }

    const result = await response.json();
    
    return { 
      success: true, 
      message: result.message || "Synchronisation réussie"
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      message: `Erreur lors de la synchronisation: ${errorMessage}`
    };
  }
};
