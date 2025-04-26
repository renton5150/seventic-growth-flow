
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWakeUpEdgeFunctions = () => {
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);
  const [lastWakeUpAttempt, setLastWakeUpAttempt] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [wakeUpStatus, setWakeUpStatus] = useState<Record<string, boolean>>({
    'acelle-proxy': false,
    'sync-email-campaigns': false
  });

  // Automatic wake-up attempt when component loads
  useEffect(() => {
    const attemptInitialWakeUp = async () => {
      // Avoid too frequent attempts (less than 30 seconds interval)
      const now = Date.now();
      if (now - lastWakeUpAttempt < 30000 && lastWakeUpAttempt > 0) {
        console.log("Wake-up attempt too recent, waiting...");
        return;
      }
      
      console.log("Initial attempt to wake up Edge Functions");
      await wakeUpEdgeFunctions();
    };
    
    if (!isInitialized) {
      attemptInitialWakeUp();
      setIsInitialized(true);
    }
  }, [isInitialized, lastWakeUpAttempt]);

  // Status reset after successful wake-up
  useEffect(() => {
    if (wakeUpStatus['acelle-proxy'] && wakeUpStatus['sync-email-campaigns']) {
      const timer = setTimeout(() => {
        setWakeUpStatus({
          'acelle-proxy': false,
          'sync-email-campaigns': false
        });
      }, 60000); // Reset status after 1 minute
      
      return () => clearTimeout(timer);
    }
  }, [wakeUpStatus]);

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
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            console.log(`Attempt #${attempt + 1} to ping acelle-proxy`);
            const response = await fetch(
              'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping', 
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache, no-store, must-revalidate'
                },
                signal: AbortSignal.timeout(10000) // Increased timeout for more reliability
              }
            );
            
            if (response.ok) {
              console.log("acelle-proxy function is now awake");
              setWakeUpStatus(prev => ({ ...prev, 'acelle-proxy': true }));
              return { service: 'acelle-proxy', success: true };
            }
            
            // If failed, wait before next attempt
            console.error(`Failed to wake up acelle-proxy (attempt ${attempt + 1}): ${response.status}`);
            if (attempt < 4) await new Promise(r => setTimeout(r, 2000 + (attempt * 500)));
          } catch (error) {
            console.error(`Error pinging acelle-proxy (attempt ${attempt + 1}):`, error);
            if (attempt < 4) await new Promise(r => setTimeout(r, 2000 + (attempt * 500)));
          }
        }
        return { service: 'acelle-proxy', success: false };
      };
      
      promises.push(pingAcelleProxy());

      // Ping sync-email-campaigns function with multiple attempts
      const pingSyncCampaigns = async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            console.log(`Attempt #${attempt + 1} to ping sync-email-campaigns`);
            const response = await fetch(
              'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', 
              {
                method: 'OPTIONS',
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                },
                signal: AbortSignal.timeout(10000) // Increased timeout
              }
            );
            
            if (response.status === 204) { // OPTIONS usually returns 204 No Content
              console.log("sync-email-campaigns function is now awake");
              setWakeUpStatus(prev => ({ ...prev, 'sync-email-campaigns': true }));
              return { service: 'sync-email-campaigns', success: true };
            }
            
            console.error(`Failed to wake up sync-email-campaigns (attempt ${attempt + 1}): ${response.status}`);
            if (attempt < 4) await new Promise(r => setTimeout(r, 2000 + (attempt * 500)));
          } catch (error) {
            console.error(`Error pinging sync-email-campaigns (attempt ${attempt + 1}):`, error);
            if (attempt < 4) await new Promise(r => setTimeout(r, 2000 + (attempt * 500)));
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
        
        // Use a warning toast instead of error to reduce alert fatigue
        toast.warning(`Services en cours d'initialisation: ${failedServices}`);
        return false;
      }
    } catch (error) {
      console.error("Error waking up edge functions:", error);
      toast.error(`Erreur d'initialisation des services: ${error.message}`);
      return false;
    } finally {
      // Add slight delay before setting isWakingUp to false
      // to prevent rapid repeated calls
      setTimeout(() => setIsWakingUp(false), 2000);
    }
  }, [isWakingUp]);

  return { wakeUpEdgeFunctions, isWakingUp, wakeUpStatus };
};
