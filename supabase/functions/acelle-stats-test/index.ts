
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Content-Type': 'application/json'
};

serve(async (req: Request) => {
  // Gestion des requêtes OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  console.log("=== DÉBUT ACELLE STATS TEST ===");
  
  try {
    let body = {};
    
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (e) {
        console.error("Erreur parsing JSON:", e);
        return new Response(JSON.stringify({ 
          success: false,
          error: "JSON invalide",
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }
    
    const url = new URL(req.url);
    const campaignId = body.campaignId || url.searchParams.get('campaignId');
    const accountId = body.accountId || url.searchParams.get('accountId');
    const forceRefresh = (body.forceRefresh || url.searchParams.get('forceRefresh')) === 'true';
    
    console.log(`Paramètres: campaignId=${campaignId}, accountId=${accountId}, forceRefresh=${forceRefresh}`);
    
    if (!campaignId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "campaignId est requis",
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!accountId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "accountId est requis",
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Variables d'environnement Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRole) {
      console.error("Variables d'environnement Supabase manquantes");
      return new Response(JSON.stringify({ 
        success: false,
        error: "Configuration Supabase manquante",
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    // Créer un client Supabase
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.4");
    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    
    // Récupération des informations du compte avec gestion d'erreur améliorée
    console.log(`Récupération du compte ${accountId}`);
    const { data: accountData, error: accountError } = await supabase
      .from("acelle_accounts")
      .select("id, name, api_token, api_endpoint")
      .eq("id", accountId)
      .maybeSingle();
    
    if (accountError) {
      console.error("Erreur compte:", accountError.message);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Erreur base de données: ${accountError.message}`,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    if (!accountData) {
      console.error("Compte non trouvé");
      return new Response(JSON.stringify({ 
        success: false,
        error: "Compte non trouvé",
        timestamp: new Date().toISOString()
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    const { api_token, api_endpoint } = accountData;
    
    if (!api_token || !api_endpoint) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Configuration API incomplète",
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Nettoyage de l'endpoint
    let cleanEndpoint = api_endpoint.trim();
    if (cleanEndpoint.endsWith('/')) {
      cleanEndpoint = cleanEndpoint.slice(0, -1);
    }
    if (cleanEndpoint.endsWith('/api/v1')) {
      cleanEndpoint = cleanEndpoint.replace(/\/api\/v1$/, '');
    }
    
    // Construction de l'URL API
    const apiUrl = `${cleanEndpoint}/api/v1/campaigns/${campaignId}?api_token=${api_token}`;
    console.log(`Appel API: ${cleanEndpoint}/api/v1/campaigns/${campaignId}?api_token=***`);
    
    // Appel à l'API avec timeout de 10 secondes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "Acelle-Stats-Test/3.0",
          "Cache-Control": "no-cache"
        },
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Erreur fetch:", fetchError);
      
      if (fetchError.name === 'AbortError') {
        return new Response(JSON.stringify({ 
          success: false,
          error: "Timeout API (10s)",
          timestamp: new Date().toISOString()
        }), {
          status: 408,
          headers: corsHeaders
        });
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: `Erreur réseau: ${fetchError.message}`,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Impossible de lire la réponse");
      console.error(`Erreur API ${response.status}:`, errorText);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: `API Error: ${response.status}`,
        message: errorText,
        timestamp: new Date().toISOString()
      }), {
        status: response.status,
        headers: corsHeaders
      });
    }
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.error("Erreur parsing JSON réponse:", jsonError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Réponse API invalide",
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    console.log("Données reçues:", typeof responseData);
    
    // Extraction des statistiques avec valeurs par défaut robustes
    const extractedStats = {
      subscriber_count: responseData.subscriber_count || 0,
      delivered_count: responseData.delivered_count || 0,
      open_count: responseData.open_count || responseData.unique_open_count || 0,
      click_count: responseData.click_count || 0,
      delivered_rate: responseData.delivered_rate || 0,
      open_rate: responseData.open_rate || 0,
      click_rate: responseData.click_rate || 0,
      bounce_count: responseData.bounce_count || 0,
      unsubscribe_count: responseData.unsubscribe_count || 0,
      status: responseData.status || "unknown",
      uniq_open_count: responseData.unique_open_count || responseData.open_count || 0,
      uniq_open_rate: responseData.unique_open_rate || responseData.open_rate || 0,
      soft_bounce_count: responseData.soft_bounce_count || 0,
      hard_bounce_count: responseData.hard_bounce_count || 0,
      abuse_complaint_count: responseData.abuse_complaint_count || 0
    };
    
    // Sauvegarder en cache avec gestion d'erreur améliorée
    try {
      const { error: cacheError } = await supabase
        .from("campaign_stats_cache")
        .upsert({
          campaign_uid: campaignId,
          account_id: accountId,
          statistics: extractedStats,
          last_updated: new Date().toISOString()
        }, { 
          onConflict: "campaign_uid,account_id" 
        });
      
      if (cacheError) {
        console.warn("Erreur cache (non bloquant):", cacheError);
      } else {
        console.log("Cache mis à jour");
      }
    } catch (err) {
      console.warn("Erreur sauvegarde cache (non bloquant):", err);
    }
    
    console.log("=== FIN ACELLE STATS TEST (SUCCÈS) ===");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Statistiques récupérées", 
      stats: extractedStats,
      account: {
        id: accountData.id,
        name: accountData.name
      },
      timestamp: new Date().toISOString()
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error("Erreur globale:", error.message);
    return new Response(JSON.stringify({ 
      success: false,
      error: "Erreur interne", 
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
