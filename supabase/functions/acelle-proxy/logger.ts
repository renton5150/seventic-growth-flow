
/**
 * Niveaux de log disponibles
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
  VERBOSE: 5
};

/**
 * Logger amélioré avec niveaux de log et formatage JSON
 * 
 * @param message - Le message à loguer
 * @param data - Les données additionnelles à inclure dans le log
 * @param level - Le niveau de log (0-5, ERROR à VERBOSE)
 * @param currentLogLevel - Le niveau de log actuel configuré pour filtrer les messages
 */
export function debugLog(
  message: string,
  data?: any,
  level: number = LOG_LEVELS.INFO,
  currentLogLevel: number = LOG_LEVELS.INFO
): void {
  // Skip logging if current log level is lower than requested
  if (level > currentLogLevel) return;
  
  const timestamp = new Date().toISOString();
  let levelName = "INFO";
  let logMethod = console.log;
  
  switch(level) {
    case LOG_LEVELS.ERROR:
      levelName = "ERROR";
      logMethod = console.error;
      break;
    case LOG_LEVELS.WARN:
      levelName = "WARN";
      logMethod = console.warn;
      break;
    case LOG_LEVELS.INFO:
      levelName = "INFO";
      logMethod = console.log;
      break;
    case LOG_LEVELS.DEBUG:
      levelName = "DEBUG";
      logMethod = console.log;
      break;
    case LOG_LEVELS.TRACE:
      levelName = "TRACE";
      logMethod = console.log;
      break;
    case LOG_LEVELS.VERBOSE:
      levelName = "VERBOSE";
      logMethod = console.log;
      break;
  }
  
  const logEntry = {
    timestamp,
    level: levelName,
    message,
    ...(data !== undefined ? { data: typeof data === 'object' ? data : { value: data } } : {})
  };
  
  logMethod(JSON.stringify(logEntry));
}

/**
 * Détermine le niveau de log à partir des paramètres de requête ou des en-têtes
 * 
 * @param url - L'URL de la requête
 * @param headers - Les en-têtes de la requête
 * @returns Le niveau de log à utiliser
 */
export function determineLogLevel(url: URL, headers: Headers): number {
  const debugParam = url.searchParams.get('debug');
  const debugLevel = url.searchParams.get('debug_level') || headers.get('x-debug-level');
  
  if (debugParam === 'true') {
    if (debugLevel === 'verbose') {
      return LOG_LEVELS.VERBOSE;
    } else if (debugLevel === 'trace') {
      return LOG_LEVELS.TRACE;
    } else if (debugLevel === 'debug') {
      return LOG_LEVELS.DEBUG;
    } else {
      return LOG_LEVELS.DEBUG; // Default debug level
    }
  } else {
    return LOG_LEVELS.INFO; // Default info level
  }
}
