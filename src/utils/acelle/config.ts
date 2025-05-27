
/**
 * Configuration globale pour le module Acelle
 */

// Activer/désactiver le mode développeur global
export const ACELLE_DEV_MODE = false;

// Configuration des endpoints
export const SUPABASE_FUNCTION_BASE_URL = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1";

// Configuration des timeouts - AUGMENTÉS pour les APIs lentes
export const API_TIMEOUT_MS = 60000; // Augmenté de 30s à 60s pour les APIs lentes
export const API_TIMEOUT_SLOW_MS = 90000; // Timeout spécial pour les APIs très lentes
export const API_TIMEOUT_FAST_MS = 15000; // Timeout pour les APIs rapides
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
  RETRY_ON_ERROR: true, // Active la tentative de nouvelle connexion en cas d'erreur
  ADAPTIVE_TIMEOUT: true // Active l'adaptation automatique des timeouts
};

// Configuration de la gestion des erreurs - AMÉLIORÉE
export const ERROR_HANDLING = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000, // Augmenté de 1s à 2s
  EXPONENTIAL_BACKOFF: true, // Nouvelle option
  MAX_RETRY_DELAY_MS: 10000, // Délai maximum entre les tentatives
  LOG_LEVEL: 'debug', // 'debug', 'info', 'warn', 'error'
};

// Configuration pour les APIs lentes - NOUVEAU
export const SLOW_API_CONFIG = {
  DETECTION_THRESHOLD_MS: 15000, // Seuil pour détecter une API lente
  SLOW_TIMEOUT_MULTIPLIER: 3, // Multiplier le timeout par 3 pour les APIs lentes
  VERY_SLOW_TIMEOUT_MULTIPLIER: 6, // Multiplier par 6 pour les APIs très lentes
  RESPONSE_TIME_HISTORY_SIZE: 10, // Nombre de mesures à garder en historique
};

// Comptes connus pour être lents - NOUVEAU
export const KNOWN_SLOW_ACCOUNTS = [
  'Dfin', // Compte DFIN identifié comme lent
];

// Fonction utilitaire pour déterminer le timeout adapté
export const getAdaptiveTimeout = (accountName: string, baseTimeout: number = API_TIMEOUT_MS): number => {
  if (KNOWN_SLOW_ACCOUNTS.includes(accountName)) {
    return API_TIMEOUT_SLOW_MS;
  }
  return baseTimeout;
};
