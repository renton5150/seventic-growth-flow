
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
  return `${CORS_PROXY_URL}/${cleanedPath}`;
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
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Acelle-Token": account.api_token,
    "X-Acelle-Endpoint": account.api_endpoint,
    ...additionalHeaders
  };
}

/**
 * Fonction pour réveiller le proxy CORS
 * @param authToken Token d'authentification optionnel
 */
export async function wakeupCorsProxy(authToken: string | null = null): Promise<boolean> {
  try {
    console.log("Réveil du proxy CORS...");
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
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
      return true;
    } else {
      console.error(`Erreur lors du réveil du proxy CORS: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la tentative de réveil du proxy CORS:", error);
    return false;
  }
}
