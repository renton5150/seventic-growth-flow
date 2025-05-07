
/**
 * Utilitaires pour interagir avec le proxy CORS
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Réveille le proxy CORS si nécessaire et teste sa disponibilité
 */
export async function wakeupCorsProxy(authToken: string): Promise<boolean> {
  try {
    console.log("Tentative de réveil du CORS proxy...");
    
    // URL de l'endpoint de heartbeat du proxy
    const proxyUrl = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/heartbeat";
    
    // Effectuer une requête pour réveiller le proxy
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Request-ID": `wakeup_${Date.now()}`
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Proxy CORS réveillé :", data);
      return true;
    } else {
      console.error("Échec du réveil du proxy CORS:", await response.text());
      return false;
    }
  } catch (error) {
    console.error("Erreur lors du réveil du proxy CORS:", error);
    return false;
  }
}

/**
 * Récupère un token d'authentification valide
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data?.session?.access_token) {
      console.error("Erreur lors de la récupération du token d'authentification:", error);
      return null;
    }
    
    return data.session.access_token;
  } catch (error) {
    console.error("Exception lors de la récupération du token d'authentification:", error);
    return null;
  }
}
