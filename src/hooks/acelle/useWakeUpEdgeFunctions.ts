
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWakeUpEdgeFunctions = () => {
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);

  const wakeUpEdgeFunctions = useCallback(async () => {
    if (isWakingUp) {
      console.log("Already waking up edge functions, skipping duplicate request");
      return true;
    }

    setIsWakingUp(true);
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

      // Ping acelle-proxy function
      promises.push(fetch(
        'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping', 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          // Add a timeout to prevent hanging requests
          signal: AbortSignal.timeout(8000)
        }
      ).then(response => {
        if (response.ok) {
          console.log("acelle-proxy function is now awake");
          return { service: 'acelle-proxy', success: true };
        } else {
          console.error(`Failed to wake up acelle-proxy: ${response.status}`);
          return { service: 'acelle-proxy', success: false, status: response.status };
        }
      }).catch(error => {
        console.error("Error during acelle-proxy wake-up:", error);
        return { service: 'acelle-proxy', success: false, error: error.message };
      }));

      // Ping sync-email-campaigns function
      promises.push(fetch(
        'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', 
        {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          // Add a timeout to prevent hanging requests
          signal: AbortSignal.timeout(8000)
        }
      ).then(response => {
        if (response.status === 204) { // OPTIONS usually returns 204 No Content
          console.log("sync-email-campaigns function is now awake");
          return { service: 'sync-email-campaigns', success: true };
        } else {
          console.error(`Failed to wake up sync-email-campaigns: ${response.status}`);
          return { service: 'sync-email-campaigns', success: false, status: response.status };
        }
      }).catch(error => {
        console.error("Error during sync-email-campaigns wake-up:", error);
        return { service: 'sync-email-campaigns', success: false, error: error.message };
      }));

      // Wait for all wake-up calls to complete
      const results = await Promise.allSettled(promises);
      console.log("Wake-up results:", results);
      
      const allServicesAwake = results.every(
        result => result.status === 'fulfilled' && result.value.success
      );
      
      if (allServicesAwake) {
        toast.success("Services initialisés avec succès");
        return true;
      } else {
        const failedServices = results
          .filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
          .map(result => {
            if (result.status === 'rejected') return result.reason;
            return result.value.service;
          })
          .join(', ');
        
        toast.warning(`Certains services n'ont pas pu être initialisés: ${failedServices}`);
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
