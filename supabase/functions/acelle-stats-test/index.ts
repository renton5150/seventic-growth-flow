
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  console.log("=== DÉBUT ACELLE STATS TEST ===");
  
  try {
    const body = await req.json();
    const { campaignId, accountId, forceRefresh, timeout = 30000 } = body; // 30 secondes par défaut
    
    console.log(`Paramètres: campaignId=${campaignId}, accountId=${accountId}, forceRefresh=${forceRefresh}, timeout=${timeout}ms`);
    
    if (!campaignId || !accountId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'campaignId et accountId requis',
        timestamp: new Date().toISOString()
      }), {
        status: 400, 
        headers: corsHeaders
      });
    }

    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les informations du compte Acelle
    console.log(`Récupération du compte ${accountId}`);
    const { data: account, error: accountError } = await supabase
      .from('acelle_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('status', 'active')
      .single();

    if (accountError || !account) {
      console.error("Erreur récupération compte:", accountError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Compte Acelle non trouvé ou inactif',
        timestamp: new Date().toISOString()
      }), {
        status: 404, 
        headers: corsHeaders
      });
    }

    // Construire l'URL API
    let apiEndpoint = account.api_endpoint?.trim();
    if (!apiEndpoint) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Endpoint API manquant',
        timestamp: new Date().toISOString()
      }), {
        status: 400, 
        headers: corsHeaders
      });
    }

    // Nettoyer l'endpoint
    if (apiEndpoint.endsWith('/')) {
      apiEndpoint = apiEndpoint.slice(0, -1);
    }
    if (apiEndpoint.endsWith('/api/v1')) {
      apiEndpoint = apiEndpoint.replace(/\/api\/v1$/, '');
    }

    const apiUrl = `${apiEndpoint}/api/v1/campaigns/${campaignId}?api_token=${account.api_token}`;
    console.log(`Appel API: ${apiUrl.replace(account.api_token, '***')}`);

    // Faire l'appel API avec timeout configuré et retry automatique
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        console.log(`Tentative ${attempt}/${maxRetries} pour campagne ${campaignId}`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Seventic-Acelle-Stats/2.0',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error(`Erreur API ${response.status} (tentative ${attempt}): ${errorText}`);
          
          // Si c'est une erreur 404 et que ce n'est pas le dernier essai, retry
          if (response.status === 404 && attempt < maxRetries) {
            console.log(`Campagne non trouvée (404), retry dans 2 secondes...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          return new Response(JSON.stringify({ 
            success: false, 
            error: `API Error ${response.status}`,
            details: errorText,
            timestamp: new Date().toISOString()
          }), {
            status: response.status, 
            headers: corsHeaders
          });
        }

        // Traiter la réponse
        const campaignData = await response.json();
        console.log(`Données de campagne reçues (tentative ${attempt})`);

        // Extraire et valider les statistiques
        const statistics = campaignData.statistics || {};
        
        // Normaliser les statistiques
        const normalizedStats = {
          subscriber_count: statistics.subscriber_count || 0,
          delivered_count: statistics.delivered_count || 0,
          delivered_rate: statistics.delivered_rate || 0,
          open_count: statistics.open_count || 0,
          uniq_open_count: statistics.uniq_open_count || 0,
          uniq_open_rate: statistics.uniq_open_rate || 0,
          click_count: statistics.click_count || 0,
          click_rate: statistics.click_rate || 0,
          bounce_count: statistics.bounce_count || 0,
          soft_bounce_count: statistics.soft_bounce_count || 0,
          hard_bounce_count: statistics.hard_bounce_count || 0,
          unsubscribe_count: statistics.unsubscribe_count || 0,
          abuse_complaint_count: statistics.abuse_complaint_count || 0
        };

        // Sauvegarder en cache si les stats ne sont pas vides
        if (normalizedStats.subscriber_count > 0 || normalizedStats.delivered_count > 0) {
          try {
            await supabase
              .from('campaign_stats_cache')
              .upsert({
                campaign_uid: campaignId,
                account_id: accountId,
                statistics: normalizedStats,
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'campaign_uid,account_id'
              });
            console.log("Statistiques sauvegardées en cache");
          } catch (cacheError) {
            console.warn("Erreur sauvegarde cache:", cacheError);
          }
        }

        console.log("=== FIN ACELLE STATS TEST (SUCCÈS) ===");

        return new Response(JSON.stringify({
          success: true,
          stats: normalizedStats,
          source: 'api',
          timestamp: new Date().toISOString()
        }), { headers: corsHeaders });

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
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Attente progressive
        }
      }
    }

    // Si on arrive ici, toutes les tentatives ont échoué
    console.error("Toutes les tentatives ont échoué:", lastError);
    
    // Essayer de récupérer depuis le cache comme fallback
    const { data: cachedStats } = await supabase
      .from('campaign_stats_cache')
      .select('statistics')
      .eq('campaign_uid', campaignId)
      .eq('account_id', accountId)
      .single();

    if (cachedStats?.statistics) {
      console.log("Fallback sur cache réussi après échec des tentatives");
      return new Response(JSON.stringify({
        success: true,
        stats: cachedStats.statistics,
        source: 'cache',
        timestamp: new Date().toISOString()
      }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: lastError?.name === 'AbortError' 
        ? `Timeout après ${maxRetries} tentatives (${timeout}ms chacune)`
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
      error: 'Erreur interne',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500, 
      headers: corsHeaders
    });
  }
});
