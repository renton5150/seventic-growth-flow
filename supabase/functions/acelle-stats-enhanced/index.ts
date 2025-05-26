
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== ACELLE STATS ENHANCED ===");

  try {
    const { campaignId, accountId, forceRefresh } = await req.json();
    
    console.log(`Récupération stats pour campagne: ${campaignId}, compte: ${accountId}`);

    // Initialiser Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les informations du compte
    const { data: account, error: accountError } = await supabase
      .from('acelle_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      console.error("Erreur récupération compte:", accountError);
      return new Response(JSON.stringify({
        success: false,
        error: "Compte non trouvé"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Compte trouvé: ${account.name}`);

    // Construire l'URL pour les statistiques
    let cleanEndpoint = account.api_endpoint.trim();
    if (cleanEndpoint.endsWith('/')) {
      cleanEndpoint = cleanEndpoint.slice(0, -1);
    }
    if (cleanEndpoint.endsWith('/api/v1')) {
      cleanEndpoint = cleanEndpoint.replace(/\/api\/v1$/, '');
    }

    const statsUrl = `${cleanEndpoint}/api/v1/campaigns/${campaignId}/statistics?api_token=${account.api_token}`;
    
    console.log(`URL stats: ${statsUrl.replace(account.api_token, '***')}`);

    // Appel API avec retry
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Tentative ${attempt}/${maxRetries} pour campagne ${campaignId}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      try {
        const response = await fetch(statsUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "User-Agent": "Seventic-Stats-Enhanced/1.0"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erreur API ${response.status}:`, errorText);
          lastError = `API Error ${response.status}: ${errorText}`;
          
          if (attempt < maxRetries) {
            console.log(`Retry dans 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          break;
        }
        
        const statsData = await response.json();
        console.log(`✅ Statistiques récupérées pour ${campaignId}:`, statsData);
        
        // Stocker en cache si demandé
        if (forceRefresh === 'true') {
          const { error: cacheError } = await supabase
            .from('campaign_stats_cache')
            .upsert({
              account_id: accountId,
              campaign_uid: campaignId,
              statistics: statsData,
              last_updated: new Date().toISOString()
            });
          
          if (cacheError) {
            console.error("Erreur mise en cache:", cacheError);
          } else {
            console.log(`✅ Stats mises en cache pour ${campaignId}`);
          }
        }
        
        return new Response(JSON.stringify({
          success: true,
          stats: statsData,
          campaign_uid: campaignId,
          cached: forceRefresh === 'true'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error(`Erreur fetch (tentative ${attempt}):`, fetchError);
        
        if (fetchError.name === 'AbortError') {
          console.log(`Timeout sur tentative ${attempt}, retry...`);
          lastError = "Timeout";
        } else {
          lastError = fetchError.message;
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    console.error(`Toutes les tentatives ont échoué: ${lastError}`);
    return new Response(JSON.stringify({
      success: false,
      error: lastError,
      retries: maxRetries
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error("Erreur globale:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
