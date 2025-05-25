
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-acelle-endpoint, x-acelle-token',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  console.log("=== DÉBUT ACELLE PROXY ===");
  
  try {
    let body = {};
    
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (e) {
        console.error("Erreur parsing JSON:", e);
        body = {};
      }
    }
    
    const url = new URL(req.url);
    const endpoint = body.endpoint || req.headers.get('x-acelle-endpoint');
    const apiToken = body.api_token || req.headers.get('x-acelle-token');
    const action = body.action || url.searchParams.get('action') || 'get_campaigns';
    
    console.log(`Action: ${action}, Endpoint présent: ${!!endpoint}, Token présent: ${!!apiToken}`);
    
    if (!endpoint || !apiToken) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Endpoint ou token manquant',
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
    
    // Construction de l'URL selon l'action
    let apiUrl = '';
    
    switch (action) {
      case 'get_campaigns':
        const page = body.page || '1';
        const perPage = body.per_page || '20';
        apiUrl = `${cleanEndpoint}/api/v1/campaigns?api_token=${apiToken}&page=${page}&per_page=${perPage}`;
        break;
        
      case 'get_campaign':
      case 'get_campaign_stats':
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
        
      case 'check_connection':
      case 'test_connection':
        apiUrl = `${cleanEndpoint}/api/v1/campaigns?api_token=${apiToken}&page=1&per_page=1`;
        break;
        
      case 'ping':
        return new Response(JSON.stringify({ 
          status: 'active', 
          message: 'Acelle Proxy actif',
          timestamp: new Date().toISOString() 
        }), {
          headers: corsHeaders
        });
        
      default:
        return new Response(JSON.stringify({ 
          success: false,
          error: `Action non supportée: ${action}`,
          timestamp: new Date().toISOString()
        }), {
          status: 400, 
          headers: corsHeaders
        });
    }
    
    console.log(`URL API construite pour action ${action}`);
    
    // Appel à l'API avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Seventic-Acelle-Proxy/2.1",
        "Cache-Control": "no-cache"
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API ${response.status}:`, errorText);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: `Erreur API: ${response.status}`,
        message: errorText,
        timestamp: new Date().toISOString()
      }), {
        status: response.status,
        headers: corsHeaders
      });
    }
    
    const responseData = await response.json();
    console.log(`Données reçues pour ${action}`);
    
    // Formatage de la réponse selon l'action
    let formattedResponse;
    
    switch (action) {
      case 'get_campaigns':
        formattedResponse = {
          success: true,
          campaigns: Array.isArray(responseData) ? responseData : (responseData.data || []),
          total: responseData.total || (Array.isArray(responseData) ? responseData.length : 0),
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'get_campaign':
      case 'get_campaign_stats':
        formattedResponse = {
          success: true,
          campaign: responseData,
          statistics: responseData.statistics || responseData,
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'check_connection':
      case 'test_connection':
        const campaigns = Array.isArray(responseData) ? responseData : (responseData.data || []);
        formattedResponse = {
          success: true,
          message: 'Connexion établie',
          campaignsCount: campaigns.length,
          timestamp: new Date().toISOString()
        };
        break;
        
      default:
        formattedResponse = {
          success: true,
          data: responseData,
          timestamp: new Date().toISOString()
        };
    }
    
    console.log("=== FIN ACELLE PROXY (SUCCÈS) ===");
    
    return new Response(JSON.stringify(formattedResponse), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error("Erreur globale:", error.message);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erreur interne du proxy',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
