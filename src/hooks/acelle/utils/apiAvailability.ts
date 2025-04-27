
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ACELLE_PROXY_BASE_URL } from "./config/acelleApiConfig";

/**
 * Vérifie si l'API Acelle est disponible
 */
export const checkApiAvailability = async (retries = 2, retryDelay = 1500): Promise<{ available: boolean, error?: string }> => {
  console.log("Vérification de la disponibilité de l'API Acelle...");
  
  try {
    // Récupérer le token JWT pour l'authentification
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("Pas de token d'accès disponible");
      return { available: false, error: "Authentification requise" };
    }
    
    // Vérifier avec une URL simple d'abord
    let attempt = 0;
    let available = false;
    let lastError = "";
    
    while (attempt < retries && !available) {
      try {
        console.log(`Tentative ${attempt + 1} de réveil de l'API...`);
        
        // Configuration de la requête avec timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const pingUrl = `${ACELLE_PROXY_BASE_URL}/ping`;
        console.log(`Ping vers: ${pingUrl}`);
        
        const response = await fetch(pingUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log("API disponible:", data);
          
          if (data.status === "active") {
            return { available: true };
          } else {
            lastError = `Service inactif: ${data.status}`;
            console.warn(lastError);
          }
        } else {
          lastError = `Erreur ${response.status} ${response.statusText}`;
          console.error("API non disponible:", lastError);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          lastError = "Délai d'attente dépassé";
          console.error("Délai d'attente dépassé lors du ping de l'API");
        } else {
          lastError = error.message || "Erreur inconnue";
          console.error("Erreur lors du ping de l'API:", error);
        }
      }
      
      attempt++;
      
      if (attempt < retries) {
        console.log(`Attente de ${retryDelay}ms avant nouvel essai...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // Si on arrive ici, toutes les tentatives ont échoué
    return { available: false, error: lastError };
  } catch (error) {
    console.error("Erreur lors de la vérification de disponibilité de l'API:", error);
    const errorMessage = error.message || "Erreur de connexion";
    
    // Afficher une notification d'erreur
    toast.error(`Erreur de connexion API: ${errorMessage}`);
    
    return { available: false, error: errorMessage };
  }
};
