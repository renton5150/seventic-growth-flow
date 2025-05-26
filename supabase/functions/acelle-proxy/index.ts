
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

  console.log("=== ACELLE PROXY NOUVELLE VERSION ROBUSTE ===");
  
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
    
    // Construction URL API selon l'action
    let apiUrl = '';
    
    switch (action) {
      case 'get_campaigns':
        const page = body.page || '1';
        const perPage = body.per_page || '100';
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

      case 'get_campaign_stats':
        const statsUid = body.campaign_uid;
        if (!statsUid) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'campaign_uid manquant pour les statistiques'
          }), { status: 400, headers: corsHeaders });
        }
        // URL spécifique pour les statistiques
        apiUrl = `${cleanEndpoint}/api/v1/campaigns/${statsUid}/statistics?api_token=${apiToken}`;
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
    
    // Appel API avec timeout et retry
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Tentative ${attempt}/${maxRetries} pour ${action}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "User-Agent": "Seventic-Acelle-Proxy/3.0"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => "Erreur inconnue");
          console.error(`Erreur API ${response.status} (tentative ${attempt}):`, errorText);
          lastError = `Erreur API ${response.status}: ${errorText}`;
          
          if (attempt === maxRetries) {
            return new Response(JSON.stringify({ 
              success: false,
              error: lastError
            }), { status: response.status, headers: corsHeaders });
          }
          continue;
        }
        
        let responseData;
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.error("Erreur parsing JSON réponse:", jsonError);
          lastError = "Réponse API invalide";
          
          if (attempt === maxRetries) {
            return new Response(JSON.stringify({ 
              success: false,
              error: lastError
            }), { status: 500, headers: corsHeaders });
          }
          continue;
        }
        
        console.log(`✅ Succès pour ${action} (tentative ${attempt})`);
        
        // Formatage de la réponse selon le type d'action
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
        } else if (action === 'get_campaign_stats') {
          // Formatage spécial pour les statistiques
          console.log(`✅ Statistiques récupérées pour campagne ${statsUid}:`, responseData);
          
          formattedResponse = {
            success: true,
            statistics: responseData,
            campaign_uid: statsUid
          };
        } else {
          // get_campaign ou autres
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
        console.error(`Erreur fetch (tentative ${attempt}):`, fetchError);
        
        const isTimeout = fetchError.name === 'AbortError';
        lastError = isTimeout ? 'Timeout API (30s)' : `Erreur réseau: ${fetchError.message}`;
        
        if (attempt < maxRetries) {
          console.log(`Retry dans 2s...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Si toutes les tentatives ont échoué
    console.error(`Toutes les tentatives ont échoué: ${lastError}`);
    return new Response(JSON.stringify({ 
      success: false,
      error: lastError || 'Échec après plusieurs tentatives',
      retries: maxRetries
    }), { status: 500, headers: corsHeaders });
    
  } catch (error) {
    console.error("Erreur globale:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erreur interne du proxy',
      message: error.message
    }), { status: 500, headers: corsHeaders });
  }
});
