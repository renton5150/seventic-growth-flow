
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
    const url = new URL(req.url);
    let body = {};
    
    // Récupération des paramètres selon la méthode
    if (req.method === 'POST') {
      body = await req.json();
    }
    
    // Récupération des paramètres depuis le body, l'URL ou les valeurs par défaut
    const campaignId = body.campaignId || url.searchParams.get('campaignId') || '63ffcc82abb3e';
    const accountId = body.accountId || url.searchParams.get('accountId');
    const forceRefresh = (body.forceRefresh || url.searchParams.get('forceRefresh')) === 'true';
    const debugMode = (body.debug || url.searchParams.get('debug')) === 'true';
    
    console.log(`Paramètres: campaignId=${campaignId}, accountId=${accountId}, forceRefresh=${forceRefresh}, debug=${debugMode}`);
    
    if (!accountId) {
      console.error("accountId manquant");
      return new Response(JSON.stringify({ 
        success: false,
        error: "accountId est requis pour obtenir le token API",
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Récupération des informations du compte Acelle depuis la base de données
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être configurés");
    }
    
    console.log(`URL Supabase: ${supabaseUrl}`);
    
    // Créer un client Supabase pour accéder à la base de données
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.4");
    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    
    console.log("Client Supabase créé avec succès");
    
    // Récupération des informations du compte Acelle
    console.log(`Récupération des informations du compte Acelle avec ID: ${accountId}`);
    const { data: accountData, error: accountError } = await supabase
      .from("acelle_accounts")
      .select("id, name, api_token, api_endpoint")
      .eq("id", accountId)
      .single();
    
    if (accountError) {
      console.error("Erreur Supabase:", accountError.message);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Échec de récupération du compte: ${accountError.message}`,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    if (!accountData) {
      console.error("Aucun compte trouvé avec cet ID");
      return new Response(JSON.stringify({ 
        success: false,
        error: "Compte non trouvé",
        timestamp: new Date().toISOString()
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    const ACELLE_API_TOKEN = accountData.api_token;
    const ACELLE_API_BASE_URL = accountData.api_endpoint;
    
    if (!ACELLE_API_TOKEN) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Token API non trouvé pour ce compte",
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    console.log(`Utilisation du compte ${accountData.name} avec endpoint: ${ACELLE_API_BASE_URL}`);
    console.log(`Token API utilisé (premiers 5 caractères): ${ACELLE_API_TOKEN.substring(0, 5)}...`);
    
    // Nettoyage de l'URL de base
    let apiBaseUrl = ACELLE_API_BASE_URL;
    if (apiBaseUrl.match(/\/api\/v1\/?$/)) {
      apiBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    }
    console.log(`URL de base après nettoyage: ${apiBaseUrl}`);
    
    // Construction de l'URL pour récupérer les statistiques de campagne
    const apiUrl = `${apiBaseUrl}/api/v1/campaigns/${campaignId}?api_token=${ACELLE_API_TOKEN}`;
    console.log(`URL complète (sans token): ${apiBaseUrl}/api/v1/campaigns/${campaignId}?api_token=***`);
    
    // Appel à l'API Acelle
    console.log("Envoi de la requête principale à Acelle...");
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Acelle-Stats-Test/2.0",
        "Cache-Control": "no-cache"
      },
      signal: AbortSignal.timeout(30000) // 30 secondes de timeout
    });
    
    const duration = Date.now() - startTime;
    console.log("Statut de la réponse:", response.status, `(${duration}ms)`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur API Acelle:", errorText);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: `Erreur API Acelle: ${response.status} ${response.statusText}`,
        message: errorText,
        duration,
        timestamp: new Date().toISOString()
      }), {
        status: response.status,
        headers: corsHeaders
      });
    }
    
    // Extraction du corps de la réponse
    const responseText = await response.text();
    console.log("Réponse reçue (longueur):", responseText.length);
    
    // Parsing JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log("Données JSON parsées avec succès");
    } catch (error) {
      console.error("Erreur lors du parsing JSON:", error.message);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Échec du parsing JSON", 
        rawResponse: responseText.substring(0, 1000),
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    // Extraction des statistiques
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
    
    console.log("Statistiques extraites:", extractedStats);
    
    // Stockage des données dans le cache (optionnel)
    try {
      if (responseData && responseData.status) {
        console.log("Mise à jour du cache de statistiques...");
        
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
          console.error("Erreur cache:", cacheError);
        } else {
          console.log("Cache mis à jour avec succès");
        }
      }
    } catch (cacheError) {
      console.error("Erreur lors du stockage en cache:", cacheError);
    }
    
    console.log("=== FIN ACELLE STATS TEST (SUCCÈS) ===");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Statistiques récupérées avec succès", 
      stats: extractedStats,
      campaign: responseData,
      account: {
        id: accountData.id,
        name: accountData.name,
        endpoint: ACELLE_API_BASE_URL
      },
      duration,
      timestamp: new Date().toISOString()
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error("Erreur globale:", error.message);
    return new Response(JSON.stringify({ 
      success: false,
      error: "Erreur lors de la récupération des statistiques", 
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
