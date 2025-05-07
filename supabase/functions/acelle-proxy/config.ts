
/**
 * Constantes de configuration pour la fonction acelle-proxy
 */
export const CONFIG = {
  // Configuration de base
  HEARTBEAT_INTERVAL: 30 * 1000, // 30 secondes
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') || 'https://dupguifqyjchlmzbadav.supabase.co',
  SERVICE_ROLE_KEY: Deno.env.get('SERVICE_ROLE_KEY') || '',
  DEFAULT_TIMEOUT: 30000, // 30 secondes timeout par défaut
  
  // Version actuelle du proxy Acelle
  VERSION: '1.6.0',
  
  // Entêtes par défaut
  DEFAULT_HEADERS: {
    'User-Agent': 'Seventic-Acelle-Proxy/1.6',
    'Accept': 'application/json'
  }
};
