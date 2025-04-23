
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const apiToken = url.searchParams.get('api_token')

    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: 'Missing api_token parameter' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract the path after /acelle-proxy/
    const path = url.pathname.replace('/acelle-proxy', '')
    
    // Forward the request to Acelle Mail API
    const acelleUrl = `https://emailing.plateforme-solution.net/api/v1${path}?api_token=${apiToken}`
    
    console.log(`Proxying request to: ${acelleUrl}`)

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }

    // Forward the request with the same method and body
    const response = await fetch(acelleUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' ? await req.text() : undefined,
    })

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { 
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in proxy:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal proxy error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
