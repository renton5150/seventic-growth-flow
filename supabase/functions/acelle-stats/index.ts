
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req: Request) => {
  // Configuration CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, cache-control",
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
    
    console.log(`[Acelle Stats] DEBUG: Using account ${accountData.name} with endpoint: ${ACELLE_API_BASE_URL}`);
    
    // TEST DIRECT: Vérification directe de l'API avant toute logique
    try {
      const testUrl = `${ACELLE_API_BASE_URL}/me?api_token=${API_TOKEN}`;
      console.log(`[Acelle Stats] TEST: Appel direct à l'API Acelle pour vérifier l'authentification: ${testUrl}`);
      
      const testResponse = await fetch(testUrl, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      
      console.log(`[Acelle Stats] TEST: Statut de la réponse auth: ${testResponse.status}`);
      
      if (testResponse.ok) {
        const authData = await testResponse.json();
        console.log(`[Acelle Stats] TEST: Authentification réussie, user: ${authData.user?.email || "unknown"}`);
      } else {
        console.error(`[Acelle Stats] TEST: Échec authentification: ${await testResponse.text()}`);
      }
    } catch (testError) {
      console.error(`[Acelle Stats] TEST: Erreur lors de l'appel d'authentification: ${testError.message}`);
    }
    
    // Construire l'URL de l'API
    let apiEndpoint: string;
    if (campaignId) {
      apiEndpoint = `${ACELLE_API_BASE_URL}/api/v1/campaigns/${campaignId}?api_token=${API_TOKEN}`;
      console.log(`[Acelle Stats] Fetching campaign details from: ${apiEndpoint}`);
    } else {
      apiEndpoint = `${ACELLE_API_BASE_URL}/api/v1/campaigns?api_token=${API_TOKEN}&page=${page}&per_page=${perPage}&sort=created_at&sort_direction=desc`;
      console.log(`[Acelle Stats] Fetching campaigns list from: ${apiEndpoint}`);
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
      const errorText = await response.text();
      console.error(`[Acelle Stats] API returned ${response.status}: ${errorText}`);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    // Récupérer les données
    const rawData = await response.json();
    console.log(`[Acelle Stats] Raw API response type: ${typeof rawData}, is array: ${Array.isArray(rawData)}`);
    console.log(`[Acelle Stats] Raw API response preview: ${JSON.stringify(rawData, null, 2).substring(0, 500)}...`);
    
    // Transformer les données
    const transformedData = campaignId ? 
      { data: transformCampaignData(rawData) } : 
      transformCampaignsList(rawData);
    
    console.log(`[Acelle Stats] Transformed data: ${JSON.stringify(transformedData, null, 2).substring(0, 500)}...`);
    
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
  // Ajouter un log pour inspecter les données brutes
  console.log("[Acelle Stats] Raw campaigns list:", JSON.stringify(data && data.data ? data.data.slice(0, 2) : data, null, 2));
  
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
 * Avec gestion améliorée des nombres et pourcentages
 */
function transformCampaignData(campaign: any): any {
  if (!campaign || !campaign.uid) {
    console.warn("[Acelle Stats] Warning: Campaign data missing UID", campaign);
    return {};
  }
  
  // Ajouter un log pour inspecter les données brutes
  console.log("[Acelle Stats] Raw campaign data:", JSON.stringify(campaign, null, 2));
  
  // Fonction utilitaire pour extraire un nombre
  const extractNumber = (value: any) => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Retirer le % si présent et convertir en nombre
      return parseFloat(value.replace('%', ''));
    }
    return 0;
  };
  
  // Transformer proprement les pourcentages en nombres décimaux
  const percentToDecimal = (value: any) => {
    const num = extractNumber(value);
    return (typeof value === 'string' && value.includes('%')) ? num / 100 : num;
  };
  
  const result = {
    id: campaign.uid,
    campaignId: campaign.uid,
    name: campaign.name || "",
    subject: campaign.subject || "",
    status: campaign.status || "unknown",
    subscriberCount: extractNumber(campaign.subscriber_count),
    deliveryRate: percentToDecimal(campaign.delivery_rate),
    deliveredCount: extractNumber(campaign.delivered_count),
    uniqueOpenCount: extractNumber(campaign.unique_open_count),
    openRate: percentToDecimal(campaign.open_rate),
    deliveredRate: percentToDecimal(campaign.delivered_rate),
    clickCount: extractNumber(campaign.click_count),
    clickRate: percentToDecimal(campaign.click_rate),
    bounceCount: extractNumber(campaign.bounce_count),
    bounceRate: percentToDecimal(campaign.bounce_rate),
    unsubscribeCount: extractNumber(campaign.unsubscribe_count),
    unsubscribeRate: percentToDecimal(campaign.unsubscribe_rate),
    spamCount: extractNumber(campaign.spam_count),
    spamRate: percentToDecimal(campaign.spam_rate),
    created_at: campaign.created_at,
    updated_at: campaign.updated_at,
    scheduled_at: campaign.run_at,
    // Champs calculés
    formattedOpenRate: `${Math.round(percentToDecimal(campaign.open_rate) * 100)}%`,
    formattedClickRate: `${Math.round(percentToDecimal(campaign.click_rate) * 100)}%`,
    formattedDeliveryRate: `${Math.round(percentToDecimal(campaign.delivered_rate) * 100)}%`
  };
  
  console.log("[Acelle Stats] Transformed campaign data:", JSON.stringify(result, null, 2));
  
  // Vérifications supplémentaires des valeurs clés pour le debug
  console.log("[Acelle Stats] KEY VALUES CHECK:");
  console.log(`subscriber_count: ${campaign.subscriber_count} → ${result.subscriberCount}`);
  console.log(`delivered_count: ${campaign.delivered_count} → ${result.deliveredCount}`);
  console.log(`open_rate: ${campaign.open_rate} → ${result.openRate}`);
  console.log(`click_rate: ${campaign.click_rate} → ${result.clickRate}`);
  
  return result;
}
