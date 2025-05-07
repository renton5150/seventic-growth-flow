
// En-têtes CORS standard
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-wake-request, x-api-key, accept, pragma, x-acelle-token, x-acelle-endpoint, x-request-id',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

/**
 * Gère les requêtes CORS preflight (OPTIONS)
 */
export function handleCorsPreflightRequest(req: Request): Response | null {
  // Retourner null si ce n'est pas une requête OPTIONS
  if (req.method !== 'OPTIONS') {
    return null;
  }

  // Répondre aux requêtes preflight avec les en-têtes CORS appropriés
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Ajoute les en-têtes CORS à une réponse
 */
export function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Crée une réponse d'erreur avec les en-têtes CORS
 */
export function createCorsErrorResponse(
  status: number, 
  message: string, 
  details?: Record<string, any>
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...details,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}
