
// Configuration de l'API Acelle

// URL de base pour l'Edge Function qui sert de proxy pour l'API Acelle
export const ACELLE_PROXY_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

// Timeout pour les requêtes API (en millisecondes)
export const API_TIMEOUT = 12000;

// Nombre de tentatives par défaut pour les opérations de synchronisation
export const DEFAULT_RETRIES = 3;

// Délai entre les tentatives (en millisecondes)
export const DEFAULT_RETRY_DELAY = 2000;

// Configuration des endpoints de l'API
export const API_ENDPOINTS = {
  CAMPAIGNS: 'campaigns',
  SUBSCRIBERS: 'subscribers',
  LISTS: 'lists',
  PING: 'ping',
  TEST: 'test-acelle-connection'
};

// Types de requêtes supportés
export const REQUEST_TYPES = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS'
};

// En-têtes CORS pour les requêtes
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
