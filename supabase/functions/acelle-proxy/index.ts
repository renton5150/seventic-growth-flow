
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  console.log("=== ACELLE PROXY SIMPLE ET ROBUSTE ===");
  
  try {
    let body = {};
    
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (e) {
        console.error("Erreur parsing JSON:", e);
        return new Response(JSON.stringify({ 
          success: false,
          error: "JSON invalide"
        }), { status: 400, headers: corsHeaders });
      }
    }
    
    const endpoint = body.endpoint;
    const apiToken = body.api_token;
    const action = body.action || 'get_campaigns';
    
    console.log(`Action: ${action}, Endpoint: ${!!endpoint}, Token: ${!!apiToken}`);
    
    if (!endpoint || !apiToken) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Endpoint ou token manquant'
      }), { status: 400, headers: corsHeaders });
    }

    // Nettoyer l'endpoint
    let cleanEndpoint = endpoint.trim();
    if (cleanEndpoint.endsWith('/')) {
      cleanEndpoint = cleanEndpoint.slice(0, -1);
    }
    if (cleanEndpoint.endsWith('/api/v1')) {
      cleanEndpoint = cleanEndpoint.replace(/\/api\/v1$/, '');
    }
    
    // Construction URL API
    let apiUrl = '';
    
    switch (action) {
      case 'get_campaigns':
        const page = body.page || '1';
        const perPage = body.per_page || '100'; // Plus de campagnes par page
        apiUrl = `${cleanEndpoint}/api/v1/campaigns?api_token=${apiToken}&page=${page}&per_page=${perPage}`;
        break;
        
      case 'get_campaign':
        const campaignUid = body.campaign_uid;
        if (!campaignUid) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'campaign_uid manquant'
          }), { status: 400, headers: corsHeaders });
        }
        apiUrl = `${cleanEndpoint}/api/v1/campaigns/${campaignUid}?api_token=${apiToken}`;
        break;
        
      case 'ping':
        return new Response(JSON.stringify({ 
          status: 'active', 
          message: 'Acelle Proxy actif'
        }), { headers: corsHeaders });
        
      default:
        return new Response(JSON.stringify({ 
          success: false,
          error: `Action non supportée: ${action}`
        }), { status: 400, headers: corsHeaders });
    }
    
    console.log(`Appel API: ${apiUrl.replace(apiToken, '***')}`);
    
    // Appel API avec timeout plus long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 secondes
    
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "Seventic-Acelle-Proxy/2.0"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Erreur inconnue");
        console.error(`Erreur API ${response.status}:`, errorText);
        
        return new Response(JSON.stringify({ 
          success: false,
          error: `Erreur API ${response.status}: ${errorText}`
        }), { status: response.status, headers: corsHeaders });
      }
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error("Erreur parsing JSON réponse:", jsonError);
        return new Response(JSON.stringify({ 
          success: false,
          error: "Réponse API invalide"
        }), { status: 500, headers: corsHeaders });
      }
      
      console.log(`✅ Données reçues pour ${action}`);
      
      // Formatage simple de la réponse
      let formattedResponse;
      
      if (action === 'get_campaigns') {
        const campaigns = Array.isArray(responseData) ? responseData : (responseData.data || []);
        
        const currentPage = parseInt(body.page || '1');
        const perPageSize = parseInt(body.per_page || '100');
        const totalFromApi = responseData.total || campaigns.length;
        const lastPageFromApi = responseData.last_page;
        
        let hasMore = false;
        if (lastPageFromApi) {
          hasMore = currentPage < lastPageFromApi;
        } else {
          hasMore = campaigns.length === perPageSize;
        }
        
        console.log(`✅ ${campaigns.length} campagnes récupérées, Total: ${totalFromApi}, HasMore: ${hasMore}`);
        
        formattedResponse = {
          success: true,
          campaigns: campaigns,
          total: totalFromApi,
          page: currentPage,
          per_page: perPageSize,
          has_more: hasMore
        };
      } else {
        formattedResponse = {
          success: true,
          campaign: responseData,
          statistics: responseData.statistics || responseData
        };
      }
      
      return new Response(JSON.stringify(formattedResponse), {
        headers: corsHeaders
      });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`Erreur fetch:`, fetchError);
      
      const isTimeout = fetchError.name === 'AbortError';
      const errorMessage = isTimeout ? 'Timeout API (60s)' : `Erreur réseau: ${fetchError.message}`;
      
      return new Response(JSON.stringify({ 
        success: false,
        error: errorMessage,
        timeout: isTimeout
      }), { status: 500, headers: corsHeaders });
    }
    
  } catch (error) {
    console.error("Erreur globale:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erreur interne du proxy',
      message: error.message
    }), { status: 500, headers: corsHeaders });
  }
});
