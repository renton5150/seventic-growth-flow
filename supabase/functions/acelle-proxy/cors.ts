
/**
 * CORS Headers Configuration
 * 
 * Configuration standard des en-têtes CORS pour toutes les réponses
 * avec support explicite pour une variété d'en-têtes.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // En production, spécifiez votre domaine
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-wake-request, x-api-key, origin, accept, pragma, x-acelle-token, x-acelle-endpoint, x-request-id',
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

/**
 * Ajoute les en-têtes CORS à une réponse existante
 */
export function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // Ajouter tous les en-têtes CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  // Retourner une nouvelle réponse avec les en-têtes CORS
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Crée une réponse d'erreur avec en-têtes CORS
 */
export function createCorsErrorResponse(
  status: number,
  message: string,
  details: any = null
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      details,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: corsHeaders
    }
  );
}
