
import { ApiAvailabilityResponse } from "../types/apiTypes";
import { ACELLE_PROXY_BASE_URL, API_TIMEOUT, DEFAULT_RETRIES, DEFAULT_RETRY_DELAY } from "../config/acelleApiConfig";

export const checkApiAvailability = async (
  retries = DEFAULT_RETRIES, 
  retryDelay = DEFAULT_RETRY_DELAY
): Promise<ApiAvailabilityResponse> => {
  try {
    console.log("Vérification de la disponibilité de l'API...");
    
    let attempt = 0;
    let lastError = null;
    
    while (attempt <= retries) {
      console.log(`Tentative #${attempt + 1} de vérification de l'API`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      try {
        console.log("Envoi de la requête ping...");
        
        const pingResponse = await fetch(
          `${ACELLE_PROXY_BASE_URL}/ping`, 
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        console.log(`Réponse ping reçue: ${pingResponse.status} ${pingResponse.statusText}`);
        
        if (pingResponse.ok) {
          const pingData = await pingResponse.json();
          console.log("Ping réussi, statut du service:", pingData);
          return { available: true, data: pingData };
        } else {
          console.warn(`Le ping a renvoyé un statut non-200: ${pingResponse.status}`);
          
          try {
            const errorData = await pingResponse.json();
            console.warn("Réponse d'erreur de ping:", errorData);
            lastError = errorData;
          } catch (e) {
            console.warn("Impossible d'analyser la réponse d'erreur de ping");
            lastError = { status: pingResponse.status };
          }
          
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, retryDelay));
            attempt++;
            continue;
          }
          
          return { available: false, error: lastError };
        }
      } catch (pingError) {
        clearTimeout(timeoutId);
        console.error(`Échec de la tentative de ping #${attempt + 1}:`, pingError);
        lastError = pingError;
        
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, retryDelay));
          attempt++;
          continue;
        }
        
        return { available: false, error: pingError.message };
      }
    }
    
    return { available: false, error: lastError?.message || "Nombre maximal de tentatives atteint" };
  } catch (error) {
    console.error("Erreur lors de la vérification de la disponibilité de l'API:", error);
    return { available: false, error: error.message };
  }
};
