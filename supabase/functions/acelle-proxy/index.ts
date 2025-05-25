
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-acelle-endpoint, x-acelle-token',
  'Content-Type': 'application/json'
};

// Initialisation du client Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceRole);

serve(async (req) => {
  // Gestion des requêtes OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  console.log("=== DÉBUT ACELLE PROXY ===");
  
  try {
    const url = new URL(req.url);
    let body = {};
    
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (e) {
        console.error("Erreur parsing JSON:", e);
        body = {};
      }
    }
    
    console.log("URL:", url.pathname);
    console.log("Method:", req.method);
    console.log("Body:", body);
    
    // Récupération des paramètres depuis le body ou les headers
    const endpoint = body.endpoint || req.headers.get('x-acelle-endpoint');
    const apiToken = body.api_token || req.headers.get('x-acelle-token');
    const action = body.action || url.searchParams.get('action') || 'get_campaigns';
    
    console.log("Endpoint:", endpoint);
    console.log("Action:", action);
    console.log("Token (5 premiers chars):", apiToken ? apiToken.substring(0, 5) + "..." : "MANQUANT");
    
    if (!endpoint) {
      console.error("Endpoint manquant");
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Endpoint Acelle manquant',
        timestamp: new Date().toISOString()
      }), {
        status: 400, 
        headers: corsHeaders
      });
    }

    if (!apiToken) {
      console.error("Token API manquant");
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Token API manquant',
        timestamp: new Date().toISOString()
      }), {
        status: 400, 
        headers: corsHeaders
      });
    }

    // Nettoyage de l'endpoint
    let cleanEndpoint = endpoint;
    if (cleanEndpoint.endsWith('/api/v1') || cleanEndpoint.endsWith('/api/v1/')) {
      cleanEndpoint = cleanEndpoint.replace(/\/api\/v1\/?$/, '');
    }
    
    console.log("Endpoint nettoyé:", cleanEndpoint);
    
    // Construction de l'URL selon l'action
    let apiUrl = '';
    
    switch (action) {
      case 'get_campaigns':
        const page = body.page || '1';
        const perPage = body.per_page || '20';
        apiUrl = `${cleanEndpoint}/api/v1/campaigns?api_token=${apiToken}&page=${page}&per_page=${perPage}`;
        break;
        
      case 'get_campaign':
        const campaignUid = body.campaign_uid;
        if (!campaignUid) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'campaign_uid manquant',
            timestamp: new Date().toISOString()
          }), {
            status: 400, 
            headers: corsHeaders
          });
        }
        apiUrl = `${cleanEndpoint}/api/v1/campaigns/${campaignUid}?api_token=${apiToken}`;
        break;
        
      case 'get_campaign_stats':
        const statsUid = body.campaign_uid;
        if (!statsUid) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'campaign_uid manquant pour les statistiques',
            timestamp: new Date().toISOString()
          }), {
            status: 400, 
            headers: corsHeaders
          });
        }
        apiUrl = `${cleanEndpoint}/api/v1/campaigns/${statsUid}?api_token=${apiToken}`;
        break;
        
      case 'check_connection':
      case 'check_status':
      case 'test_connection':
        apiUrl = `${cleanEndpoint}/api/v1/campaigns?api_token=${apiToken}&page=1&per_page=1`;
        break;
        
      case 'ping':
        return new Response(JSON.stringify({ 
          status: 'active', 
          message: 'Acelle Proxy is running',
          timestamp: new Date().toISOString() 
        }), {
          headers: corsHeaders
        });
        
      default:
        console.error("Action non supportée:", action);
        return new Response(JSON.stringify({ 
          success: false,
          error: `Action non supportée: ${action}`,
          timestamp: new Date().toISOString()
        }), {
          status: 400, 
          headers: corsHeaders
        });
    }
    
    console.log("URL finale (sans token):", apiUrl.replace(apiToken, '***'));
    
    // Appel à l'API Acelle
    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Seventic-Acelle-Proxy/2.0",
        "Cache-Control": "no-cache"
      },
      signal: AbortSignal.timeout(30000) // 30 secondes de timeout
    });
    
    const duration = Date.now() - startTime;
    console.log("Réponse Acelle:", response.status, response.statusText, `(${duration}ms)`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur Acelle API:", errorText);
      
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
    
    const responseData = await response.json();
    console.log("Données reçues:", typeof responseData, Array.isArray(responseData) ? `Array[${responseData.length}]` : 'Object');
    
    // Formatage de la réponse selon l'action
    let formattedResponse;
    
    switch (action) {
      case 'get_campaigns':
        formattedResponse = {
          success: true,
          campaigns: Array.isArray(responseData) ? responseData : (responseData.data || []),
          total: responseData.total || (Array.isArray(responseData) ? responseData.length : 0),
          duration,
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'get_campaign':
      case 'get_campaign_stats':
        formattedResponse = {
          success: true,
          campaign: responseData,
          statistics: responseData.statistics || responseData,
          duration,
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'check_connection':
      case 'check_status':
      case 'test_connection':
        const campaigns = Array.isArray(responseData) ? responseData : (responseData.data || []);
        formattedResponse = {
          success: true,
          message: 'Connexion établie avec succès',
          campaignsCount: campaigns.length,
          apiVersion: response.headers.get('X-API-Version') || 'unknown',
          duration,
          timestamp: new Date().toISOString()
        };
        break;
        
      default:
        formattedResponse = {
          success: true,
          data: responseData,
          duration,
          timestamp: new Date().toISOString()
        };
    }
    
    console.log("=== FIN ACELLE PROXY (SUCCÈS) ===");
    
    return new Response(JSON.stringify(formattedResponse), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error("Erreur globale Acelle Proxy:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erreur interne du proxy',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
