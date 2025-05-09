
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, cache-control',
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
    
    if (!accountId) {
      throw new Error("accountId est requis pour obtenir le token API");
    }
    
    // Récupérer les informations du compte Acelle depuis la base de données
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être configurés");
    }
    
    // Créer un client Supabase pour accéder à la base de données
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.4");
    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    
    // Récupérer les informations du compte Acelle depuis la base de données
    const { data: accountData, error: accountError } = await supabase
      .from("acelle_accounts")
      .select("id, name, api_token, api_endpoint")
      .eq("id", accountId)
      .single();
    
    if (accountError || !accountData) {
      throw new Error(`Échec de récupération du compte: ${accountError?.message || "Compte non trouvé"}`);
    }
    
    const ACELLE_API_TOKEN = accountData.api_token;
    const ACELLE_API_BASE_URL = accountData.api_endpoint;
    
    if (!ACELLE_API_TOKEN) {
      throw new Error("Token API non trouvé pour ce compte");
    }
    
    console.log(`Utilisation du compte ${accountData.name} avec endpoint: ${ACELLE_API_BASE_URL}`);
    
    // Construction de l'URL
    const apiUrl = `${ACELLE_API_BASE_URL}/api/v1/campaigns/${campaignId}?api_token=${ACELLE_API_TOKEN}`;
    console.log("URL de l'API Acelle:", apiUrl);
    
    // Appel direct à l'API
    console.log("Envoi de la requête à Acelle...");
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    
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
        rawResponse: responseText 
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
        status: responseData.status || "unknown"
      };
      
      stats.extractedStats = extractedStats;
      console.log("Statistiques extraites:", extractedStats);
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
      }
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    // Capture de toutes les erreurs
    console.error("Erreur globale:", error.message);
    return new Response(JSON.stringify({ 
      error: "Erreur lors du test de l'API Acelle", 
      message: error.message 
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
});
