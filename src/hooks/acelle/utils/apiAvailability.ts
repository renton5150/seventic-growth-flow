
import { supabase } from "@/integrations/supabase/client";

export const checkApiAvailability = async (retries = 2, retryDelay = 1500) => {
  try {
    console.log("Vérification de la disponibilité de l'API...");
    
    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    
    if (!accessToken) {
      console.error("No access token available for API check");
      return { available: false, error: "Authentication required" };
    }
    
    let attempt = 0;
    let lastError = null;
    
    while (attempt <= retries) {
      console.log(`Tentative #${attempt + 1} de vérification de l'API`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        console.log("Envoi d'une requête ping avec bearer token:", accessToken.substring(0, 15) + "...");
        
        const pingResponse = await fetch(
          'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping', 
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Acelle-Endpoint': 'ping',
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
          console.log("Ping successful, service status:", pingData);
          return { available: true, data: pingData };
        } else {
          console.warn(`Ping returned non-200 status: ${pingResponse.status}`);
          
          try {
            const responseText = await pingResponse.text();
            console.warn("Ping error response:", responseText);
          } catch (e) {
            console.warn("Could not read ping error response");
          }
          
          lastError = { status: pingResponse.status };
          
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, retryDelay));
            attempt++;
            continue;
          }
          
          return { available: false, status: pingResponse.status };
        }
      } catch (pingError) {
        clearTimeout(timeoutId);
        console.log(`Ping attempt #${attempt + 1} failed:`, pingError);
        lastError = pingError;
        
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, retryDelay));
          attempt++;
          continue;
        }
        
        return { available: false, error: pingError.message };
      }
    }
    
    return { available: false, error: lastError?.message || "Max retries reached" };
  } catch (error) {
    console.error("Error checking API availability:", error);
    return { available: false, error: error.message };
  }
};
