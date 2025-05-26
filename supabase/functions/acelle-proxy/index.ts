
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-acelle-endpoint, x-acelle-token',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  console.log("=== ACELLE PROXY ULTRA-ROBUSTE ===");
  
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
    const endpoint = body.endpoint || req.headers.get('x-acelle-endpoint');
    const apiToken = body.api_token || req.headers.get('x-acelle-token');
    const action = body.action || url.searchParams.get('action') || 'get_campaigns';
    const timeout = parseInt(body.timeout || '60000'); // Timeout beaucoup plus long
    
    console.log(`Action: ${action}, Endpoint présent: ${!!endpoint}, Token présent: ${!!apiToken}, Timeout: ${timeout}ms`);
    
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
    let cleanEndpoint = endpoint.trim();
    if (cleanEndpoint.endsWith('/')) {
      cleanEndpoint = cleanEndpoint.slice(0, -1);
    }
    if (cleanEndpoint.endsWith('/api/v1')) {
      cleanEndpoint = cleanEndpoint.replace(/\/api\/v1$/, '');
    }
    
    // Construction de l'URL selon l'action
    let apiUrl = '';
    
    switch (action) {
      case 'get_campaigns':
        const page = body.page || '1';
        const perPage = body.per_page || '100'; // Beaucoup plus de campagnes par page
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
    
    console.log(`URL API construite pour action ${action}: ${apiUrl.replace(apiToken, '***')}`);
    
    // Appel API robuste avec retry automatique
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    let lastError = null;
    let response = null;
    
    // Tentative unique mais robuste
    try {
      console.log(`Appel API robuste pour ${action} (timeout: ${timeout}ms)`);
      
      response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "Seventic-Acelle-Proxy/10.0",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Impossible de lire la réponse");
        console.error(`Erreur API ${response.status}:`, errorText);
        
        return new Response(JSON.stringify({ 
          success: false,
          error: `Erreur API ${response.status}`,
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
          error: "Réponse API invalide (JSON)",
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
      
      console.log(`Données reçues pour ${action} - Type: ${typeof responseData}`);
      
      // Formatage robuste de la réponse
      let formattedResponse;
      
      switch (action) {
        case 'get_campaigns':
          const campaigns = Array.isArray(responseData) ? responseData : (responseData.data || []);
          
          // Pagination robuste
          const currentPage = parseInt(body.page || '1');
          const perPageSize = parseInt(body.per_page || '100');
          
          const totalFromApi = responseData.total || responseData.meta?.total || campaigns.length;
          const lastPageFromApi = responseData.last_page || responseData.meta?.last_page;
          const currentPageFromApi = responseData.current_page || responseData.meta?.current_page || currentPage;
          
          let hasMore = false;
          if (lastPageFromApi) {
            hasMore = currentPageFromApi < lastPageFromApi;
          } else if (totalFromApi) {
            const expectedLastPage = Math.ceil(totalFromApi / perPageSize);
            hasMore = currentPageFromApi < expectedLastPage;
          } else {
            hasMore = campaigns.length === perPageSize;
          }
          
          console.log(`✅ Campagnes: ${campaigns.length}, Total: ${totalFromApi}, HasMore: ${hasMore}, Page: ${currentPageFromApi}`);
          
          formattedResponse = {
            success: true,
            campaigns: campaigns,
            total: totalFromApi,
            page: currentPageFromApi,
            per_page: perPageSize,
            has_more: hasMore,
            last_page: lastPageFromApi,
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
          const testCampaigns = Array.isArray(responseData) ? responseData : (responseData.data || []);
          formattedResponse = {
            success: true,
            message: 'Connexion établie',
            campaignsCount: testCampaigns.length,
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
      
      console.log("=== FIN ACELLE PROXY (SUCCÈS TOTAL) ===");
      
      return new Response(JSON.stringify(formattedResponse), {
        headers: corsHeaders
      });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`Erreur fetch critique:`, fetchError);
      
      const isTimeout = fetchError.name === 'AbortError';
      const errorMessage = isTimeout 
        ? `Timeout API critique (${timeout}ms)` 
        : `Erreur réseau critique: ${fetchError.message}`;
      
      return new Response(JSON.stringify({ 
        success: false,
        error: errorMessage,
        timeout: isTimeout,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
  } catch (error) {
    console.error("Erreur globale critique:", error.message);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erreur interne critique du proxy',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
