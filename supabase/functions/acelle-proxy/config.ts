
/**
 * Configuration globale pour le proxy Acelle
 */
export const CONFIG = {
  // Version du proxy
  VERSION: "1.1.0",
  
  // URL de l'API Supabase (récupérée depuis les variables d'environnement)
  SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "",
  
  // Clé de service Supabase (récupérée depuis les variables d'environnement)
  SERVICE_ROLE_KEY: Deno.env.get("SERVICE_ROLE_KEY") || "",
  
  // Timeout par défaut pour les requêtes HTTP (en ms)
  DEFAULT_TIMEOUT: 30000, // 30 secondes
  
  // Intervalle entre les heartbeats (en ms)
  HEARTBEAT_INTERVAL: 30000, // 30 secondes
  
  // Niveau de logging par défaut
  DEFAULT_LOG_LEVEL: 3, // 0 = aucun, 1 = erreur, 2 = avertissement, 3 = info, 4 = debug, 5 = verbeux
};
