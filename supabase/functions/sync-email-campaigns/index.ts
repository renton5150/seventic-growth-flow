
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = 'https://dupguifqyjchlmzbadav.supabase.co';
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchCampaignsForAccount(account: any) {
  try {
    // Ensure endpoint is formatted correctly
    const apiEndpoint = account.api_endpoint.endsWith('/') 
      ? account.api_endpoint.slice(0, -1) 
      : account.api_endpoint;
      
    console.log(`Fetching campaigns for account: ${account.name} from ${apiEndpoint}/api/v1/campaigns`);
    
    // Vérification des paramètres d'API
    if (!account.api_token || !apiEndpoint) {
      console.error(`Invalid API configuration for account ${account.name}: missing API token or endpoint`);
      await updateAccountStatus(account.id, 'error: invalid API configuration');
      return { success: false, error: 'Invalid API configuration' };
    }
    
    // Appel direct à l'API Acelle (pas via le proxy)
    const url = `${apiEndpoint}/api/v1/campaigns?api_token=${account.api_token}&include_stats=true`;
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching campaigns for ${account.name}: Status ${response.status}, Response: ${errorText}`);
      await updateAccountStatus(account.id, `error: API returned ${response.status}`);
      return { success: false, error: `API Error: ${response.status}`, details: errorText };
    }

    const campaigns = await response.json();
    console.log(`Retrieved ${campaigns.length} campaigns for account ${account.name}`);
    
    // Update cache for each campaign
    for (const campaign of campaigns) {
      // Ensure the delivery_info is properly structured as a JSON object
      const deliveryInfo = {
        total: campaign.statistics?.subscriber_count || 0,
        delivered: campaign.statistics?.delivered_count || 0,
        delivery_rate: campaign.statistics?.delivered_rate || 0,
        opened: campaign.statistics?.open_count || 0,
        unique_open_rate: campaign.statistics?.uniq_open_rate || 0,
        clicked: campaign.statistics?.click_count || 0,
        click_rate: campaign.statistics?.click_rate || 0,
        bounced: {
          soft: campaign.statistics?.soft_bounce_count || 0,
          hard: campaign.statistics?.hard_bounce_count || 0,
          total: campaign.statistics?.bounce_count || 0
        },
        unsubscribed: campaign.statistics?.unsubscribe_count || 0,
        complained: campaign.statistics?.abuse_complaint_count || 0
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
  } catch (error) {
    console.error(`Error syncing account ${account.name}:`, error);
    await updateAccountStatus(account.id, `error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Helper function to update account status
async function updateAccountStatus(accountId: string, errorMessage?: string) {
  try {
    const updateData: Record<string, any> = { 
      last_sync_date: new Date().toISOString() 
    };
    
    if (errorMessage) {
      console.log(`Setting error status for account ${accountId}: ${errorMessage}`);
      // Store the error message in cache_last_updated field for tracking
      updateData.cache_last_updated = new Date().toISOString();
    }
    
    await supabase
      .from('acelle_accounts')
      .update(updateData)
      .eq('id', accountId);
      
  } catch (err) {
    console.error(`Failed to update status for account ${accountId}:`, err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data: accounts, error } = await supabase
      .from('acelle_accounts')
      .select('*')
      .eq('status', 'active')
      .order('cache_priority', { ascending: false });

    if (error) throw error;

    console.log(`Found ${accounts.length} active Acelle accounts to sync`);
    if (accounts.length === 0) {
      return new Response(JSON.stringify({ message: 'No active accounts to sync' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    for (const account of accounts) {
      console.log(`Processing account: ${account.name}, API endpoint: ${account.api_endpoint}`);
      const result = await fetchCampaignsForAccount(account);
      results.push({ account: account.name, ...result });
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error in sync-email-campaigns:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
