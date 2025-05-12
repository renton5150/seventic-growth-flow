
/**
 * Configuration globale pour le module Acelle
 */

// Activer/désactiver le mode développeur global
export const ACELLE_DEV_MODE = false;

// Configuration des endpoints
export const SUPABASE_FUNCTION_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1";

// Configuration des timeouts
export const API_TIMEOUT_MS = 30000; // Augmenté de 15s à 30s pour éviter les timeouts
export const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// Configuration du cache
export const CACHE_PRIORITY = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0
};

// Configuration des fonctionnalités
export const FEATURES = {
  BACKGROUND_SYNC: true,
  CACHE_STATISTICS: true,
  AUTOMATIC_REFRESH: true,
  DEBUG_MODE: true, // Active le mode debug pour plus de logs
  RETRY_ON_ERROR: true // Active la tentative de nouvelle connexion en cas d'erreur
};

// Configuration de la gestion des erreurs
export const ERROR_HANDLING = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  LOG_LEVEL: 'debug', // 'debug', 'info', 'warn', 'error'
};

