
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req: Request) => {
  // Configuration CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
    "Content-Type": "application/json"
  };

  // Gestion des requêtes OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Récupérer les paramètres de la requête
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");
    const page = url.searchParams.get("page") || "1";
    const perPage = url.searchParams.get("perPage") || "50";
    const accountId = url.searchParams.get("accountId") || "";
    const forceRefresh = url.searchParams.get("forceRefresh") === "true";
    
    if (!accountId) {
      throw new Error("accountId is required");
    }
    
    // Créer un client Supabase pour accéder à la base de données
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
    }
    
    // Utiliser service_role pour accéder aux données sensibles comme les tokens API
    const supabase = createClient(supabaseUrl, supabaseServiceRole || supabaseKey);
    
    // Récupérer les informations du compte Acelle depuis la base de données
    const { data: accountData, error: accountError } = await supabase
      .from("acelle_accounts")
      .select("id, name, api_token, api_endpoint")
      .eq("id", accountId)
      .single();
    
    if (accountError || !accountData) {
      throw new Error(`Failed to get account data: ${accountError?.message || "Account not found"}`);
    }
    
    const API_TOKEN = accountData.api_token;
    const ACELLE_API_BASE_URL = accountData.api_endpoint;
    
    if (!API_TOKEN) {
      throw new Error("API token not found for this account");
    }
    
    // Construire l'URL de l'API
    let apiEndpoint: string;
    if (campaignId) {
      apiEndpoint = `${ACELLE_API_BASE_URL}/api/v1/campaigns/${campaignId}?api_token=${API_TOKEN}`;
    } else {
      apiEndpoint = `${ACELLE_API_BASE_URL}/api/v1/campaigns?api_token=${API_TOKEN}&page=${page}&per_page=${perPage}&sort=created_at&sort_direction=desc`;
    }
    
    // Vérifier si nous avons les données en cache
    const cacheKey = `acelle_stats_${accountId}_${campaignId || 'list'}_${page}_${perPage}`;
    
    if (!forceRefresh) {
      const { data: cachedData, error: cacheError } = await supabase
        .from("email_campaigns_cache")
        .select("data, created_at")
        .eq("cache_key", cacheKey)
        .maybeSingle();
      
      // Si nous avons des données en cache récentes (moins de 15 minutes), les utiliser
      const isCacheValid = cachedData && 
        (new Date().getTime() - new Date(cachedData.created_at).getTime()) < 15 * 60 * 1000;
      
      if (isCacheValid) {
        return new Response(JSON.stringify({
          ...cachedData.data,
          fromCache: true,
          cacheTime: cachedData.created_at
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
    }
    
    // Effectuer la requête vers l'API Acelle
    console.log(`[Acelle Stats] Fetching from: ${accountData.name} - ${apiEndpoint}`);
    const response = await fetch(apiEndpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${await response.text()}`);
    }
    
    // Récupérer les données
    const rawData = await response.json();
    
    // Transformer les données
    const transformedData = campaignId ? 
      { data: transformCampaignData(rawData) } : 
      transformCampaignsList(rawData);
    
    // Ajouter des informations complémentaires
    const result = {
      ...transformedData,
      accountId: accountData.id,
      accountName: accountData.name,
      lastUpdated: new Date().toISOString()
    };
    
    // Mettre en cache les données
    await supabase
      .from("email_campaigns_cache")
      .upsert({
        cache_key: cacheKey,
        data: result,
        created_at: new Date().toISOString()
      });
    
    // Retourner la réponse formatée
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error(`[Acelle Stats] Error: ${error.message}`);
    
    // Retourner une erreur formatée
    return new Response(JSON.stringify({
      error: true,
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

/**
 * Transforme la liste des campagnes au format attendu
 */
function transformCampaignsList(data: any): { data: any[], meta?: any } {
  // Si data est déjà un objet avec une propriété 'data', extraire le tableau
  if (data && data.data && Array.isArray(data.data)) {
    return {
      data: data.data.map(transformCampaignData),
      meta: {
        total: data.total || 0,
        per_page: data.per_page || 10,
        current_page: data.current_page || 1,
        last_page: data.last_page || 1
      }
    };
  }
  
  // Si data est un tableau, transformer chaque élément
  if (Array.isArray(data)) {
    return {
      data: data.map(transformCampaignData)
    };
  }
  
  // Pour tout autre cas, retourner un objet avec data vide
  return {
    data: []
  };
}

/**
 * Transforme les données d'une campagne au format attendu
 */
function transformCampaignData(campaign: any): any {
  if (!campaign || !campaign.uid) {
    console.warn("[Acelle Stats] Warning: Campaign data missing UID", campaign);
    return {};
  }
  
  return {
    id: campaign.uid,
    campaignId: campaign.uid,
    name: campaign.name || "",
    subject: campaign.subject || "",
    status: campaign.status || "unknown",
    subscriberCount: parseInt(campaign.subscriber_count || "0"),
    deliveryRate: parseFloat((campaign.delivery_rate || "0").replace("%", "")) / 100,
    deliveredCount: parseInt(campaign.delivered_count || "0"),
    uniqueOpenCount: parseInt(campaign.unique_open_count || "0"),
    openRate: parseFloat((campaign.open_rate || "0").replace("%", "")) / 100,
    deliveredRate: parseFloat((campaign.delivered_rate || "0").replace("%", "")) / 100,
    clickCount: parseInt(campaign.click_count || "0"),
    clickRate: parseFloat((campaign.click_rate || "0").replace("%", "")) / 100,
    bounceCount: parseInt(campaign.bounce_count || "0"),
    bounceRate: parseFloat((campaign.bounce_rate || "0").replace("%", "")) / 100,
    unsubscribeCount: parseInt(campaign.unsubscribe_count || "0"),
    unsubscribeRate: parseFloat((campaign.unsubscribe_rate || "0").replace("%", "")) / 100,
    spamCount: parseInt(campaign.spam_count || "0"),
    spamRate: parseFloat((campaign.spam_rate || "0").replace("%", "")) / 100,
    created_at: campaign.created_at,
    updated_at: campaign.updated_at,
    scheduled_at: campaign.run_at,
    // Ajout de champs calculés utiles
    formattedOpenRate: `${Math.round(parseFloat((campaign.open_rate || "0").replace("%", "")))}%`,
    formattedClickRate: `${Math.round(parseFloat((campaign.click_rate || "0").replace("%", "")))}%`,
    formattedDeliveryRate: `${Math.round(parseFloat((campaign.delivered_rate || "0").replace("%", "")))}%`
  };
}
