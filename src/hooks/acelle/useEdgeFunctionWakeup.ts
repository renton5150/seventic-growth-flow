
import { useState, useCallback } from 'react';

/**
 * Hook pour gérer le réveil des Edge Functions
 * 
 * Ce hook permet d'envoyer des requêtes de "réveil" aux Edge Functions
 * de Supabase qui peuvent être en mode veille, assurant ainsi leur
 * disponibilité avant d'effectuer des opérations importantes.
 */
export const useEdgeFunctionWakeup = () => {
  const [wakeupAttempts, setWakeupAttempts] = useState(0);
  const [wakeupStatus, setWakeupStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  /**
   * Réveille les Edge Functions nécessaires pour l'application
   * 
   * @param authToken - Token d'authentification pour les requêtes autorisées
   * @returns Promise<boolean> - true si le réveil est réussi, false sinon
   */
  const wakeUpEdgeFunctions = useCallback(async (authToken: string | null): Promise<boolean> => {
    try {
      console.log("Tentative de réveil des Edge Functions");
      setWakeupStatus('pending');
      
      if (!authToken) {
        console.error("Pas de session d'authentification disponible pour la requête de réveil");
        setWakeupStatus('error');
        return false;
      }
      
      setWakeupAttempts(prev => prev + 1);
      
      // Construire l'URL complète de l'edge function
      const supabaseUrl = 'https://dupguifqyjchlmzbadav.supabase.co';
      const wakeUrl = `${supabaseUrl}/functions/v1/cors-proxy/ping`;
      
      console.log(`Envoi de la requête de réveil à: ${wakeUrl}`);
      
      // Récupération de l'origine pour les en-têtes CORS
      const origin = window.location.origin;
      
      // Réveiller le proxy CORS avec des en-têtes améliorés
      const corsProxyResponse = await fetch(wakeUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-Wake-Request': 'true',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': origin
        },
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      if (corsProxyResponse.ok) {
        const data = await corsProxyResponse.json();
        console.log("Réveil du proxy CORS réussi:", data);
      } else {
        console.warn(`Le proxy CORS a répondu avec le code: ${corsProxyResponse.status}`);
        if (corsProxyResponse.status === 0) {
          console.warn("Réponse avec code 0 - probablement une erreur CORS ou réseau");
        }
      }
      
      // Réveiller également la fonction acelle-proxy
      try {
        const acelleProxyUrl = `${supabaseUrl}/functions/v1/acelle-proxy/ping`;
        const acelleResponse = await fetch(acelleProxyUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'X-Wake-Request': 'true',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': origin
          },
          mode: 'cors',
          credentials: 'same-origin'
        });
        
        if (acelleResponse.ok) {
          console.log("Réveil de acelle-proxy réussi");
        } else {
          console.warn(`acelle-proxy a répondu avec le code: ${acelleResponse.status}`);
        }
      } catch (e) {
        console.warn("Erreur lors de la requête de réveil de acelle-proxy, mais ce n'est pas bloquant:", e);
      }
      
      // Réveiller également la fonction de synchronisation
      try {
        const syncUrl = `${supabaseUrl}/functions/v1/sync-email-campaigns`;
        const syncResponse = await fetch(syncUrl, {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': origin
          },
          mode: 'cors',
          credentials: 'same-origin'
        });
        
        console.log(`Réveil de sync-email-campaigns: ${syncResponse.status}`);
      } catch (e) {
        console.warn("Erreur lors du réveil de sync-email-campaigns, mais ce n'est pas bloquant:", e);
      }
      
      // Un petit délai pour laisser le temps aux services de se réveiller complètement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setWakeupStatus('success');
      return true;
    } catch (e) {
      console.error("Erreur lors du réveil des Edge Functions:", e);
      setWakeupStatus('error');
      return false;
    }
  }, []);

  return {
    wakeupAttempts,
    wakeupStatus,
    wakeUpEdgeFunctions
  };
};
