
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

  console.log("=== DÉBUT ACELLE PROXY ===");
  
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
    const timeout = parseInt(body.timeout || '60000'); // 60 secondes
    
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
        const perPage = body.per_page || '200'; // Augmenter à 200 pour récupérer plus de campagnes par page
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
    
    // Appel à l'API avec timeout et retry améliorés
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        console.log(`Tentative ${attempt}/${maxRetries} pour ${action}`);
        
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "User-Agent": "Seventic-Acelle-Proxy/6.0",
            "Cache-Control": "no-cache",
            "Connection": "close"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => "Impossible de lire la réponse");
          console.error(`Erreur API ${response.status} (tentative ${attempt}):`, errorText);
          
          // Pas de retry pour les erreurs 404
          if (response.status === 404) {
            return new Response(JSON.stringify({ 
              success: false,
              error: `Ressource non trouvée (404)`,
              message: errorText,
              timestamp: new Date().toISOString()
            }), {
              status: 404,
              headers: corsHeaders
            });
          }
          
          // Retry pour les erreurs 5xx et timeouts
          if (response.status >= 500 && attempt < maxRetries) {
            console.log(`Erreur serveur ${response.status}, retry dans 3 secondes...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          
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
        
        let responseData;
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.error("Erreur parsing JSON réponse:", jsonError);
          
          if (attempt < maxRetries) {
            console.log(`Erreur JSON, retry dans 2 secondes...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          return new Response(JSON.stringify({ 
            success: false,
            error: "Réponse API invalide (JSON)",
            timestamp: new Date().toISOString()
          }), {
            status: 500,
            headers: corsHeaders
          });
        }
        
        console.log(`Données reçues pour ${action} - Type: ${typeof responseData}, Tentative: ${attempt}`);
        
        // Formatage de la réponse selon l'action
        let formattedResponse;
        
        switch (action) {
          case 'get_campaigns':
            const campaigns = Array.isArray(responseData) ? responseData : (responseData.data || []);
            
            // Calculer s'il y a plus de pages en se basant sur la réponse
            const currentPage = parseInt(body.page || '1');
            const perPageSize = parseInt(body.per_page || '200');
            const hasMore = campaigns.length === perPageSize; // S'il y a exactement perPage éléments, il y a probablement une autre page
            
            console.log(`Campagnes récupérées: ${campaigns.length}, Page: ${currentPage}, PerPage: ${perPageSize}, HasMore: ${hasMore}`);
            
            formattedResponse = {
              success: true,
              campaigns: campaigns,
              total: responseData.total || campaigns.length,
              page: currentPage,
              per_page: perPageSize,
              has_more: hasMore,
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
        
        console.log("=== FIN ACELLE PROXY (SUCCÈS) ===");
        
        return new Response(JSON.stringify(formattedResponse), {
          headers: corsHeaders
        });
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        lastError = fetchError;
        console.error(`Erreur fetch (tentative ${attempt}):`, fetchError);
        
        if (fetchError.name === 'AbortError') {
          console.log(`Timeout sur tentative ${attempt}, retry...`);
        } else {
          console.log(`Erreur réseau sur tentative ${attempt}, retry...`);
        }
        
        // Si ce n'est pas la dernière tentative, attendre avant de retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Attente progressive
        }
      }
    }
    
    // Si on arrive ici, toutes les tentatives ont échoué
    console.error("Toutes les tentatives ont échoué:", lastError);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: lastError?.name === 'AbortError' 
        ? `Timeout API (${timeout}ms) après ${maxRetries} tentatives`
        : `Erreur réseau après ${maxRetries} tentatives: ${lastError?.message}`,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
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
