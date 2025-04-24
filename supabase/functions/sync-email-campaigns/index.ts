
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
    
    const response = await fetch(`${apiEndpoint}/api/v1/campaigns?api_token=${account.api_token}&include_stats=true`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Error fetching campaigns: ${response.status}`);
    }

    const campaigns = await response.json();
    console.log(`Retrieved ${campaigns.length} campaigns for account ${account.name}`);
    
    // Update cache for each campaign
    for (const campaign of campaigns) {
      // Ensure the delivery_info is properly structured as a JSON object
      const deliveryInfo = {
        total: campaign.statistics?.subscriber_count || 0,
        delivered: campaign.statistics?.delivered_count || 0,
        opened: campaign.statistics?.open_count || 0,
        clicked: campaign.statistics?.click_count || 0,
        bounced: {
          soft: campaign.statistics?.soft_bounce_count || 0,
          hard: campaign.statistics?.hard_bounce_count || 0,
          total: campaign.statistics?.bounce_count || 0
        },
        unsubscribed: campaign.statistics?.unsubscribe_count || 0,
        complained: campaign.statistics?.abuse_complaint_count || 0,
        delivery_rate: campaign.statistics?.delivered_rate || 0,
        unique_open_rate: campaign.statistics?.uniq_open_rate || 0,
        click_rate: campaign.statistics?.click_rate || 0
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
    await supabase
      .from('acelle_accounts')
      .update({ last_sync_date: new Date().toISOString() })
      .eq('id', account.id);

    return { success: true, count: campaigns.length };
  } catch (error) {
    console.error(`Error syncing account ${account.name}:`, error);
    return { success: false, error: error.message };
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
