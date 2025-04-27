
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Amélioré avec des entêtes CORS complets selon les recommandations
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-acelle-endpoint, x-acelle-token, x-page, x-per-page, x-include-stats, Origin, Accept',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 heures de cache pour les préflights
};

// Service has been deprecated
console.log("Email campaign functionality has been removed");

serve(async (req) => {
  // Enhanced CORS handling for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, // Standard status for successful OPTIONS requests
      headers: corsHeaders 
    });
  }
  
  return new Response(JSON.stringify({
    message: "Email campaign functionality has been removed from the application",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
