
import { AcelleAccount } from "@/types/acelle.types";

// URL de base du proxy CORS
const CORS_PROXY_URL = import.meta.env.VITE_CORS_PROXY_URL || "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";

/**
 * Construit l'URL complète pour faire une requête via le proxy CORS
 * @param path Chemin de l'API après la base URL
 */
export function buildCorsProxyUrl(path: string): string {
  // Enlever le slash initial si présent pour éviter les doubles slashes
  const cleanedPath = path.startsWith('/') ? path.substring(1) : path;
  // Assurer que l'URL est bien formée
  try {
    const baseUrl = CORS_PROXY_URL.endsWith('/') ? CORS_PROXY_URL.slice(0, -1) : CORS_PROXY_URL;
    return `${baseUrl}/${cleanedPath}`;
  } catch (error) {
    console.error("Erreur lors de la construction de l'URL du proxy CORS:", error);
    return `${CORS_PROXY_URL}/${cleanedPath}`;
  }
}

/**
 * Construit les en-têtes pour faire une requête via le proxy CORS
 * @param account Le compte Acelle pour lequel faire la requête
 * @param additionalHeaders En-têtes supplémentaires à inclure
 */
export function buildCorsProxyHeaders(
  account: AcelleAccount,
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  // Vérifier que le token et l'endpoint sont définis
  if (!account.api_token || !account.api_endpoint) {
    console.warn("API token ou endpoint manquant pour le compte", account.name || account.id);
  }

  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Acelle-Token": account.api_token || "",
    "X-Acelle-Endpoint": account.api_endpoint || "",
    "X-Request-ID": generateRequestId(), // Ajouter un ID unique pour chaque requête
    "Cache-Control": "no-cache, no-store, must-revalidate", // Éviter les problèmes de cache
    ...additionalHeaders
  };
}

/**
 * Génère un ID de requête unique pour le debug
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Fonction pour réveiller le proxy CORS avec retry et backoff
 * @param authToken Token d'authentification optionnel
 */
export async function wakeupCorsProxy(authToken: string | null = null): Promise<boolean> {
  const maxRetries = 3;
  let retryCount = 0;
  let success = false;

  console.log("Tentative de réveil du proxy CORS...");

  while (retryCount < maxRetries && !success) {
    try {
      // Backoff exponentiel
      if (retryCount > 0) {
        const delay = Math.pow(2, retryCount - 1) * 1000;
        console.log(`Retry ${retryCount}/${maxRetries}, attente de ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Request-Origin": "client",
        "X-Request-ID": generateRequestId(),
        "Cache-Control": "no-cache, no-store, must-revalidate"
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(CORS_PROXY_URL, {
        method: "GET",
        headers
      });
      
      if (response.ok) {
        console.log("Proxy CORS réveillé avec succès");
        success = true;
        return true;
      } else {
        console.warn(`Erreur lors du réveil du proxy CORS: ${response.status} ${response.statusText}`);
        retryCount++;
      }
    } catch (error) {
      console.error("Exception lors de la tentative de réveil du proxy CORS:", error);
      retryCount++;
    }
  }
  
  console.error(`Échec du réveil du proxy CORS après ${maxRetries} tentatives`);
  return false;
}
