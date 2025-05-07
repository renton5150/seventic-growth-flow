
/**
 * Configuration pour le proxy CORS
 * Contient les constantes et paramètres du service
 */

export const CONFIG = {
  // URL Supabase pour accéder aux secrets
  SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "",
  
  // Clé de rôle service pour les opérations privilégiées
  SERVICE_ROLE_KEY: Deno.env.get("SERVICE_ROLE_KEY") || "",
  
  // Intervalle de heartbeat en millisecondes (par défaut 20 secondes)
  HEARTBEAT_INTERVAL: parseInt(Deno.env.get("HEARTBEAT_INTERVAL") || "20000"),
  
  // Timeout par défaut pour les requêtes API (30 secondes)
  DEFAULT_TIMEOUT: parseInt(Deno.env.get("DEFAULT_TIMEOUT") || "30000"),
  
  // En-têtes CORS standards pour toutes les réponses
  CORS_HEADERS: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-wake-request, x-api-key, origin, accept, pragma, x-acelle-token, x-acelle-endpoint, x-request-id',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
};
