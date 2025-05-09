
/**
 * Utilitaires pour la gestion des URLs du proxy pour l'API Acelle
 */

/**
 * Construit l'URL pour le proxy CORS
 * Utilise le paramètre api_token dans l'URL comme exigé par l'API Acelle
 */
export const buildProxyUrl = (path: string, params: Record<string, string> = {}): string => {
  const baseProxyUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy';
  
  // Nettoyer le chemin pour éviter les doubles slashes
  const apiPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Construire l'URL de base
  let proxyUrl = `${baseProxyUrl}/${apiPath}`;
  
  // On combine tous les paramètres, y compris l'api_token désormais
  // On ne filtre plus le token, car il doit être dans l'URL
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.append(key, value);
  }
  
  // Ajouter les paramètres à l'URL
  if (searchParams.toString()) {
    proxyUrl += '?' + searchParams.toString();
  }
  
  return proxyUrl;
};
