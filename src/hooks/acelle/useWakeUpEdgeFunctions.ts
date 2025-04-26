
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWakeUpEdgeFunctions = () => {
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);
  const [lastWakeUpAttempt, setLastWakeUpAttempt] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Tentative automatique de réveil au chargement du composant
  useEffect(() => {
    const attemptInitialWakeUp = async () => {
      // Éviter les tentatives trop fréquentes (moins de 30 secondes d'intervalle)
      const now = Date.now();
      if (now - lastWakeUpAttempt < 30000 && lastWakeUpAttempt > 0) {
        console.log("Tentative de réveil trop récente, attente...");
        return;
      }
      
      console.log("Tentative initiale de réveil des Edge Functions");
      await wakeUpEdgeFunctions();
    };
    
    if (!isInitialized) {
      attemptInitialWakeUp();
      setIsInitialized(true);
    }
  }, [isInitialized, lastWakeUpAttempt]);

  const wakeUpEdgeFunctions = useCallback(async () => {
    if (isWakingUp) {
      console.log("Already waking up edge functions, skipping duplicate request");
      return true;
    }

    setIsWakingUp(true);
    setLastWakeUpAttempt(Date.now());
    
    try {
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available for wake up");
        toast.error("Authentification requise pour initialiser les services");
        return false;
      }

      // First ping the acelle-proxy function to wake it up
      console.log("Waking up acelle-proxy function...");
      
      const promises = [];

      // Ping acelle-proxy function with multiple attempts
      const pingAcelleProxy = async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            console.log(`Tentative #${attempt + 1} de ping acelle-proxy`);
            const response = await fetch(
              'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping', 
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache, no-store, must-revalidate'
                },
                signal: AbortSignal.timeout(8000)
              }
            );
            
            if (response.ok) {
              console.log("acelle-proxy function is now awake");
              return { service: 'acelle-proxy', success: true };
            }
            
            // Si échec, attendre avant la prochaine tentative
            console.error(`Failed to wake up acelle-proxy (attempt ${attempt + 1}): ${response.status}`);
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
          } catch (error) {
            console.error(`Error pinging acelle-proxy (attempt ${attempt + 1}):`, error);
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
          }
        }
        return { service: 'acelle-proxy', success: false };
      };
      
      promises.push(pingAcelleProxy());

      // Ping sync-email-campaigns function with multiple attempts
      const pingSyncCampaigns = async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            console.log(`Tentative #${attempt + 1} de ping sync-email-campaigns`);
            const response = await fetch(
              'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', 
              {
                method: 'OPTIONS',
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                },
                signal: AbortSignal.timeout(8000)
              }
            );
            
            if (response.status === 204) { // OPTIONS usually returns 204 No Content
              console.log("sync-email-campaigns function is now awake");
              return { service: 'sync-email-campaigns', success: true };
            }
            
            console.error(`Failed to wake up sync-email-campaigns (attempt ${attempt + 1}): ${response.status}`);
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
          } catch (error) {
            console.error(`Error pinging sync-email-campaigns (attempt ${attempt + 1}):`, error);
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
          }
        }
        return { service: 'sync-email-campaigns', success: false };
      };
      
      promises.push(pingSyncCampaigns());

      // Wait for all wake-up calls to complete
      const results = await Promise.all(promises);
      console.log("Wake-up results:", results);
      
      const allServicesAwake = results.every(result => result.success);
      
      if (allServicesAwake) {
        toast.success("Services initialisés avec succès");
        return true;
      } else {
        const failedServices = results
          .filter(result => !result.success)
          .map(result => result.service)
          .join(', ');
        
        toast.warning(`Services en cours d'initialisation: ${failedServices}`);
        return false;
      }
    } catch (error) {
      console.error("Error waking up edge functions:", error);
      toast.error(`Erreur d'initialisation des services: ${error.message}`);
      return false;
    } finally {
      setIsWakingUp(false);
    }
  }, [isWakingUp]);

  return { wakeUpEdgeFunctions, isWakingUp };
};
