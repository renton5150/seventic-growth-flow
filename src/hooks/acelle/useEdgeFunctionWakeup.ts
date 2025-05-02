
import { useState, useCallback } from 'react';

/**
 * Hook pour gérer le réveil des Edge Functions
 */
export const useEdgeFunctionWakeup = () => {
  const [wakeupAttempts, setWakeupAttempts] = useState(0);

  // Fonction pour réveiller les Edge Functions
  const wakeUpEdgeFunctions = useCallback(async (authToken: string | null): Promise<boolean> => {
    try {
      console.log("Tentative de réveil des Edge Functions");
      
      if (!authToken) {
        console.error("Pas de session d'authentification disponible pour la requête de réveil");
        return false;
      }
      
      setWakeupAttempts(prev => prev + 1);
      
      // Réveiller le proxy CORS avec des en-têtes améliorés
      const wakeUrl = 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/cors-proxy/ping';
      console.log(`Envoi de la requête de réveil à: ${wakeUrl}`);
      
      try {
        const response = await fetch(wakeUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Cache-Control': 'no-store',
            'X-Wake-Request': 'true',
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          credentials: 'same-origin'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Réveil du proxy CORS réussi:", data);
        } else {
          console.warn(`Le proxy CORS a répondu avec le code: ${response.status}`);
        }
      } catch (e) {
        console.warn("Erreur lors de la requête de réveil du proxy, mais ce n'est pas bloquant:", e);
      }
      
      // Réveiller également la fonction de synchronisation avec des en-têtes améliorés
      try {
        const response = await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Cache-Control': 'no-store',
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          credentials: 'same-origin'
        });
        
        console.log(`Réveil de sync-email-campaigns: ${response.status}`);
      } catch (e) {
        console.warn("Erreur lors du réveil de sync-email-campaigns, mais ce n'est pas bloquant:", e);
      }
      
      // Un petit délai pour laisser le temps aux services de se réveiller complètement
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (e) {
      console.error("Erreur lors du réveil des Edge Functions:", e);
      return false;
    }
  }, []);

  return {
    wakeupAttempts,
    wakeUpEdgeFunctions
  };
};
