
import { supabase } from "@/integrations/supabase/client";

export const checkApiAvailability = async (retries = 2, retryDelay = 1500) => {
  try {
    console.log("Vérification de la disponibilité de l'API...");
    
    // Obtenir le token d'accès Supabase
    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    
    if (!accessToken) {
      console.error("Pas de token d'accès disponible pour la vérification de l'API");
      return { available: false, error: "Authentification requise" };
    }
    
    let attempt = 0;
    let lastError = null;
    
    while (attempt <= retries) {
      console.log(`Tentative #${attempt + 1} de vérification de l'API`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        console.log("Envoi de la requête ping avec Supabase token:", accessToken.substring(0, 15) + "...");
        
        // Utiliser le Supabase token pour appeler notre Edge Function
        const pingResponse = await fetch(
          'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping', 
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`, // Token Supabase pour l'Edge Function
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (pingResponse.status === 302) {
          console.error("Échec d'authentification - redirigé vers la page de connexion");
          lastError = { status: 401, message: "Échec d'authentification" };
          
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, retryDelay));
            attempt++;
            continue;
          }
          
          return { available: false, error: "Échec d'authentification" };
        }
        
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
