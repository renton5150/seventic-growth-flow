
/**
 * CORS Headers Configuration
 * 
 * Configuration standard des en-têtes CORS pour toutes les réponses
 * avec support explicite pour une variété d'en-têtes.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // En production, spécifiez votre domaine
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-wake-request, x-api-key, origin, accept, pragma, x-acelle-token, x-acelle-endpoint',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 heures de cache pour les requêtes preflight
  'Vary': 'Origin', // Important pour les CDNs et caches intermédiaires
  'Content-Type': 'application/json'
};

/**
 * Gère les requêtes OPTIONS CORS preflight avec en-têtes CORS complets
 * 
 * @param req - La requête entrante
 * @returns Response - Une réponse 204 avec les en-têtes CORS
 */
export function handleCorsPreflightRequest(req: Request): Response {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  return null;
}
