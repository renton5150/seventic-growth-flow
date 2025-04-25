
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Amélioré avec des entêtes CORS complets selon les recommandations
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 heures de cache pour les préflights
};

const supabaseUrl = 'https://dupguifqyjchlmzbadav.supabase.co';
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Service activity tracking
let lastActivity = Date.now();
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

// Logger amélioré avec support de débogage
function debugLog(message: string, data?: any, isError: boolean = false) {
  const timestamp = new Date().toISOString();
  const logMethod = isError ? console.error : console.log;
  
  if (data) {
    logMethod(`[${timestamp}] DEBUG - ${message}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    logMethod(`[${timestamp}] DEBUG - ${message}`);
  }
}

// Helper function pour tester l'accessibilité d'une URL
async function testEndpointAccess(url: string): Promise<{success: boolean, message: string}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return { success: true, message: `URL accessible: ${url}, status: ${response.status}` };
    } else {
      return { success: false, message: `URL inaccessible: ${url}, status: ${response.status}, statusText: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, message: `Erreur lors du test d'URL: ${url}, erreur: ${error.message}` };
  }
}

// Heartbeat recording function
async function recordHeartbeat() {
  try {
    await supabase.from('edge_function_stats').upsert({
      function_name: 'sync-email-campaigns',
      last_heartbeat: new Date().toISOString(),
      status: 'active'
    }, { onConflict: 'function_name' });
    
    debugLog("Heartbeat recorded for sync-email-campaigns");
    lastActivity = Date.now();
  } catch (error) {
    debugLog("Failed to record heartbeat:", error, true);
  }
}

// Start heartbeat interval
setInterval(async () => {
  // Only log if the function has been idle for a while
  if (Date.now() - lastActivity > HEARTBEAT_INTERVAL) {
    debugLog(`Heartbeat at ${new Date().toISOString()} - Service active`);
    await recordHeartbeat();
  }
}, HEARTBEAT_INTERVAL);

async function fetchCampaignsForAccount(account: any) {
  try {
    // Ensure endpoint is formatted correctly (remove trailing slash if present)
    const apiEndpoint = account.api_endpoint?.endsWith('/') 
      ? account.api_endpoint.slice(0, -1) 
      : account.api_endpoint;
      
    debugLog(`Processing account: ${account.name}, API endpoint: ${apiEndpoint}`);
    
    // Vérification des paramètres d'API
    if (!account.api_token || !apiEndpoint) {
      debugLog(`Invalid API configuration for account ${account.name}: missing API token or endpoint`, null, true);
      await updateAccountStatus(account.id, 'error: invalid API configuration');
      return { success: false, error: 'Invalid API configuration' };
    }
    
    // Test d'accessibilité de l'endpoint avant de procéder
    const accessTest = await testEndpointAccess(apiEndpoint);
    debugLog(`API endpoint accessibility test for ${account.name}:`, accessTest);
    
    if (!accessTest.success) {
      await updateAccountStatus(account.id, `error: API endpoint inaccessible - ${accessTest.message}`);
      return { success: false, error: 'API endpoint inaccessible', details: accessTest.message };
    }
    
    // FIXED: Avoid duplicate api/v1 in the URL path
    // Check if the API endpoint already includes /api/v1
    const apiPath = apiEndpoint.includes('/api/v1') ? '' : '/api/v1';
    const url = `${apiEndpoint}${apiPath}/campaigns?api_token=${account.api_token}&include_stats=true`;
    
    debugLog(`Making request to: ${url}`);
    
    // Set up timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // Extended to 25 seconds
    
    try {
      // Log all request headers
      const requestHeaders = { 
        'Accept': 'application/json',
        'User-Agent': 'Seventic-Acelle-Sync/1.4', // Updated version
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      };
      
      debugLog(`Request headers for ${account.name}:`, requestHeaders);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Log response headers for debugging
      const responseHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeadersObj[key] = value;
      });
      debugLog(`Response headers for ${account.name}:`, responseHeadersObj);

      if (!response.ok) {
        const errorText = await response.text();
        debugLog(`Error fetching campaigns for ${account.name}: Status ${response.status}, Response: ${errorText}`, null, true);
        await updateAccountStatus(account.id, `error: API returned ${response.status}`);
        return { 
          success: false, 
          error: `API Error: ${response.status}`, 
          details: errorText,
          endpoint: apiEndpoint
        };
      }

      const campaigns = await response.json();
      debugLog(`Retrieved ${campaigns.length} campaigns for account ${account.name}`);
      
      // Debug sample data
      if (campaigns.length > 0) {
        debugLog(`Sample campaign data for ${account.name}:`, campaigns[0]);
      }
      
      // Update cache for each campaign
      for (const campaign of campaigns) {
        // Ensure the delivery_info is properly structured as a JSON object
        const deliveryInfo = {
          total: parseInt(campaign.statistics?.subscriber_count) || 0,
          delivered: parseInt(campaign.statistics?.delivered_count) || 0,
          delivery_rate: parseFloat(campaign.statistics?.delivered_rate) || 0,
          opened: parseInt(campaign.statistics?.open_count) || 0,
          unique_open_rate: parseFloat(campaign.statistics?.uniq_open_rate) || 0,
          clicked: parseInt(campaign.statistics?.click_count) || 0,
          click_rate: parseFloat(campaign.statistics?.click_rate) || 0,
          bounced: {
            soft: parseInt(campaign.statistics?.soft_bounce_count) || 0,
            hard: parseInt(campaign.statistics?.hard_bounce_count) || 0,
            total: parseInt(campaign.statistics?.bounce_count) || 0
          },
          unsubscribed: parseInt(campaign.statistics?.unsubscribe_count) || 0,
          complained: parseInt(campaign.statistics?.abuse_complaint_count) || 0,
          unsubscribe_rate: parseFloat(campaign.statistics?.unsubscribe_rate) || 0,
          bounce_rate: parseFloat(campaign.statistics?.bounce_rate) || 0
        };

        await supabase.from('email_campaigns_cache').upsert({
          campaign_uid: campaign.uid,
          account_id: account.id,
          name: campaign.name,
          subject: campaign.subject,
          status: campaign.status,
          created_at: campaign.created_at,
          updated_at: campaign.updated_at,
          delivery_date: campaign.delivery_at || campaign.run_at,
          run_at: campaign.run_at,
          last_error: campaign.last_error,
          delivery_info: deliveryInfo,
          cache_updated_at: new Date().toISOString()
        }, {
          onConflict: 'campaign_uid'
        });
      }

      // Update last sync time for account
      await updateAccountStatus(account.id);

      return { success: true, count: campaigns.length };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        debugLog(`Request to ${apiEndpoint} timed out`, null, true);
        await updateAccountStatus(account.id, 'error: API request timed out');
        return { success: false, error: 'Request timed out', endpoint: apiEndpoint };
      }
      
      throw fetchError;
    }
  } catch (error) {
    debugLog(`Error syncing account ${account.name}:`, error, true);
    await updateAccountStatus(account.id, `error: ${error.message}`);
    return { 
      success: false, 
      error: error.message,
      account: account.name,
      endpoint: account.api_endpoint
    };
  }
}

// Helper function to update account status
async function updateAccountStatus(accountId: string, errorMessage?: string) {
  try {
    const updateData: Record<string, any> = { 
      last_sync_date: new Date().toISOString() 
    };
    
    if (errorMessage) {
      debugLog(`Setting error status for account ${accountId}: ${errorMessage}`);
      updateData.last_sync_error = errorMessage;
    } else {
      updateData.last_sync_error = null;
    }
    
    const { error } = await supabase
      .from('acelle_accounts')
      .update(updateData)
      .eq('id', accountId);
      
    if (error) {
      debugLog(`Failed to update status for account ${accountId}:`, error, true);
    }
  } catch (err) {
    debugLog(`Failed to update status for account ${accountId}:`, err, true);
  }
}

serve(async (req) => {
  // Record activity and update heartbeat
  lastActivity = Date.now();
  await recordHeartbeat();
  
  // Log the authorization header to help debug authentication issues
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    debugLog("Authorization header provided:", authHeader.substring(0, 15) + "...");
  } else {
    debugLog("No authorization header provided", null, true);
  }
  
  // Enhanced CORS handling for preflight requests
  if (req.method === 'OPTIONS') {
    debugLog("Handling OPTIONS preflight request for sync-email-campaigns with complete CORS headers");
    return new Response(null, { 
      status: 204, // Standard status for successful OPTIONS requests
      headers: corsHeaders 
    });
  }

  try {
    debugLog("Starting sync-email-campaigns function");
    
    // Parse request body
    let startServices = false;
    let forceSync = false;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        startServices = !!body.startServices;
        forceSync = !!body.forceSync;
        debugLog("Request options:", { startServices, forceSync });
      } catch (e) {
        debugLog("Could not parse request body", e, true);
      }
    }
    
    const { data: accounts, error } = await supabase
      .from('acelle_accounts')
      .select('*')
      .eq('status', 'active')
      .order('cache_priority', { ascending: false });

    if (error) {
      debugLog("Error fetching accounts:", error, true);
      throw error;
    }

    debugLog(`Found ${accounts.length} active Acelle accounts to sync`);
    if (accounts.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No active accounts to sync',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    for (const account of accounts) {
      debugLog(`Processing account: ${account.name}, API endpoint: ${account.api_endpoint}`);
      const result = await fetchCampaignsForAccount(account);
      results.push({ 
        account: account.name, 
        accountId: account.id,
        endpoint: account.api_endpoint,
        ...result 
      });
    }

    // Update edge function stats
    await supabase.from('edge_function_stats').upsert({
      function_name: 'sync-email-campaigns',
      last_heartbeat: new Date().toISOString(),
      last_run_success: true,
      last_run_time: new Date().toISOString(),
      status: 'active'
    }, { onConflict: 'function_name' });

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      nextScheduledSync: new Date(Date.now() + 30 * 60 * 1000).toISOString() // estimate next sync
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    debugLog(`Error in sync-email-campaigns:`, error, true);
    
    // Record error in stats
    await supabase.from('edge_function_stats').upsert({
      function_name: 'sync-email-campaigns',
      last_heartbeat: new Date().toISOString(),
      last_run_success: false,
      last_error: error.message,
      last_run_time: new Date().toISOString(),
      status: 'error'
    }, { onConflict: 'function_name' });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
