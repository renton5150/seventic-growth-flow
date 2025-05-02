
// CORS headers for all responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Pour le développement - en production, limitez aux domaines spécifiques
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, origin, accept, x-requested-with",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400", // 24 heures pour le cache des requêtes preflight
  "Vary": "Origin" // Important pour les CDNs et caches intermédiaires
};
