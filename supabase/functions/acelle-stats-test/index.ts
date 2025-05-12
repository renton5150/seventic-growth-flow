
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, cache-control, x-debug-level, x-acelle-key, x-account-id, x-account-token',
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

  // Logs de démarrage
  console.log("=== DÉBUT TEST ACELLE API ===");
  
  try {
    // Configuration
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('campaignId') || '63ffcc82abb3e';
    const accountId = url.searchParams.get('accountId');
    const forceRefresh = url.searchParams.get('forceRefresh') === 'true';
    const debugMode = url.searchParams.get('debug') === 'true';
    
    console.log(`Paramètres: campaignId=${campaignId}, accountId=${accountId}, forceRefresh=${forceRefresh}, debug=${debugMode}`);
    
    if (!accountId) {
      throw new Error("accountId est requis pour obtenir le token API");
    }
    
    // Récupérer les informations du compte Acelle depuis la base de données
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
    
    // Récupérer les informations du compte Acelle depuis la base de données
    console.log(`Récupération des informations du compte Acelle avec ID: ${accountId}`);
    const { data: accountData, error: accountError } = await supabase
      .from("acelle_accounts")
      .select("id, name, api_token, api_endpoint")
      .eq("id", accountId)
      .single();
    
    if (accountError) {
      console.error("Erreur Supabase:", accountError.message);
      throw new Error(`Échec de récupération du compte: ${accountError.message}`);
    }
    
    if (!accountData) {
      console.error("Aucun compte trouvé avec cet ID");
      throw new Error("Compte non trouvé");
    }
    
    const ACELLE_API_TOKEN = accountData.api_token;
    const ACELLE_API_BASE_URL = accountData.api_endpoint;
    
    if (!ACELLE_API_TOKEN) {
      throw new Error("Token API non trouvé pour ce compte");
    }
    
    console.log(`Utilisation du compte ${accountData.name} avec endpoint: ${ACELLE_API_BASE_URL}`);
    
    // Logging sécurisé du token (premiers caractères seulement)
    console.log(`Token API utilisé (premiers 5 caractères seulement): ${ACELLE_API_TOKEN.substring(0, 5)}...`);
    
    // Détection plus robuste pour les variations de /api/v1
    let apiBaseUrl = ACELLE_API_BASE_URL;
    if (apiBaseUrl.match(/\/api\/v1\/?$/)) {
      console.log("URL de base contient déjà /api/v1, ajustement pour éviter la duplication");
      apiBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    }
    console.log(`URL de base après ajustement: ${apiBaseUrl}`);
    
    // Construction de l'URL - CORRIGÉE pour éviter le doublon /api/v1/api/v1/
    const apiUrl = `${apiBaseUrl}/api/v1/campaigns/${campaignId}?api_token=${ACELLE_API_TOKEN}`;
    console.log(`URL complète (sans token): ${apiBaseUrl}/api/v1/campaigns/${campaignId}?api_token=***`);
    
    // Tester la disponibilité de l'API avant l'appel principal
    try {
      // URL de test également corrigée pour éviter le doublon
      const testUrl = `${apiBaseUrl}/api/v1/campaigns?api_token=${ACELLE_API_TOKEN}&page=1&per_page=1`;
      console.log(`Test de disponibilité de l'API: ${apiBaseUrl}/api/v1/campaigns?api_token=***&page=1&per_page=1`);
      
      const testResponse = await fetch(testUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "Acelle-Test/1.0",
          "Cache-Control": "no-cache"
        },
        signal: AbortSignal.timeout(60000) // 60 secondes de timeout
      });
      
      console.log("Résultat du test de disponibilité:", {
        status: testResponse.status,
        statusText: testResponse.statusText,
        headers: Object.fromEntries(testResponse.headers.entries())
      });
      
      if (!testResponse.ok) {
        const testBody = await testResponse.text();
        console.error("Test API a échoué:", testBody);
      } else {
        console.log("Test API réussi, récupération des données principales");
      }
    } catch (testError) {
      console.error("Erreur lors du test de disponibilité:", testError);
    }
    
    // Appel principal à l'API
    console.log("Envoi de la requête principale à Acelle...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 secondes de timeout
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Acelle-Test/1.0",
        "Cache-Control": "no-cache"
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Logs de la réponse
    console.log("Statut de la réponse:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    
    // Extraction du corps de la réponse
    const responseText = await response.text();
    console.log("Corps de la réponse brute:", responseText);
    
    // Tentative de parsing JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log("Données JSON parsées:", JSON.stringify(responseData, null, 2));
    } catch (error) {
      console.error("Erreur lors du parsing JSON:", error.message);
      return new Response(JSON.stringify({ 
        error: "Échec du parsing JSON", 
        rawResponse: responseText,
        error_details: error instanceof Error ? error.message : "Erreur inconnue"
      }), {
        headers: corsHeaders,
        status: 500
      });
    }
    
    // Analyse du format des statistiques
    const stats = {
      rawData: responseData,
      extractedStats: {}
    };
    
    if (responseData) {
      // Tentative d'extraction des statistiques clés
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
        // Ajout de champs manquants pour une compatibilité totale
        uniq_open_count: responseData.unique_open_count || responseData.open_count || 0,
        uniq_open_rate: responseData.unique_open_rate || responseData.open_rate || 0,
        soft_bounce_count: responseData.soft_bounce_count || 0,
        hard_bounce_count: responseData.hard_bounce_count || 0,
        abuse_complaint_count: responseData.abuse_complaint_count || 0
      };
      
      stats.extractedStats = extractedStats;
      console.log("Statistiques extraites:", extractedStats);
    }
    
    // Stockage des données dans la cache de statistiques (si la campagne existe)
    try {
      if (responseData && responseData.status) {
        console.log("Tentative de mise à jour du cache de statistiques...");
        
        // Stockage de la réponse brute pour référence ultérieure
        const fullStatisticsData = {
          ...stats.extractedStats,
          raw_response: responseText  // Stockage de la réponse brute pour dépannage
        };
        
        const { error: statsError } = await supabase
          .from("campaign_stats_cache")
          .upsert({
            campaign_uid: campaignId,
            account_id: accountId,
            statistics: stats.extractedStats,
            last_updated: new Date().toISOString()
          }, { 
            onConflict: "campaign_uid,account_id" 
          });
        
        if (statsError) {
          console.error("Erreur lors de la mise à jour du cache:", statsError);
        } else {
          console.log("Mise à jour du cache réussie");
        }
      }
    } catch (cacheError) {
      console.error("Erreur lors du stockage en cache:", cacheError);
    }
    
    // Retour des données brutes pour analyse
    console.log("=== FIN TEST ACELLE API ===");
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Test API Acelle réussi", 
      data: responseData,
      stats: stats.extractedStats,
      account: {
        id: accountData.id,
        name: accountData.name,
        endpoint: ACELLE_API_BASE_URL
      },
      api_url: {
        original: ACELLE_API_BASE_URL,
        corrected: apiBaseUrl,
        final: `${apiBaseUrl}/api/v1/campaigns/${campaignId}?api_token=***`
      }
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    // Capture de toutes les erreurs
    console.error("Erreur globale:", error.message);
    return new Response(JSON.stringify({ 
      error: "Erreur lors du test de l'API Acelle", 
      message: error.message,
      stack: error.stack
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
});
