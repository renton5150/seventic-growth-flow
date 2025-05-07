
/**
 * Configuration globale pour le proxy Acelle
 */
export const CONFIG = {
  // Version du proxy
  VERSION: "2.0.0",
  
  // URL de l'API Supabase (récupérée depuis les variables d'environnement)
  SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "",
  
  // Clé de service Supabase (récupérée depuis les variables d'environnement)
  SERVICE_ROLE_KEY: Deno.env.get("SERVICE_ROLE_KEY") || "",
  
  // Timeout par défaut pour les requêtes HTTP (en ms) - réduit pour éviter les timeouts serveur
  DEFAULT_TIMEOUT: 20000, // 20 secondes
  
  // Intervalle entre les heartbeats (en ms)
  HEARTBEAT_INTERVAL: 20000, // 20 secondes (réduit pour plus de réactivité)
  
  // Niveau de logging par défaut
  DEFAULT_LOG_LEVEL: 3, // 0 = aucun, 1 = erreur, 2 = avertissement, 3 = info, 4 = debug, 5 = verbeux
  
  // Headers de réponse standard
  CORS_HEADERS: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, x-acelle-key, x-debug-level, x-auth-method, x-wake-request, x-api-key, origin, accept, pragma, x-acelle-token, x-acelle-endpoint, x-request-id',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};
