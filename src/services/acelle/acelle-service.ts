
/**
 * Construit l'URL pour les appels à l'API Acelle via le proxy CORS
 */
export const buildProxyUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = '/api/cors-proxy';
  
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
  }
  
  const queryString = queryParams.toString();
  return `${baseUrl}/${endpoint}${queryString ? `?${queryString}` : ''}`;
};

/**
 * Construit l'URL pour les appels directs à l'API Acelle
 * Format: https://acelle-domain.com/public/api/v1/endpoint?api_token=token
 */
export const buildDirectApiUrl = (
  endpoint: string, 
  baseUrl: string,
  params?: Record<string, string>
): string => {
  // S'assurer que l'URL de base n'a pas de slash à la fin
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // S'assurer que l'URL de base contient le chemin /public/api/v1/
  const apiPath = cleanBaseUrl.includes('/public/api/v1') ? '' : '/public/api/v1';
  
  // Construire les paramètres de requête
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
  }
  
  const queryString = queryParams.toString();
  return `${cleanBaseUrl}${apiPath}/${endpoint}${queryString ? `?${queryString}` : ''}`;
};
