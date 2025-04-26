
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkApiAvailability } from "./utils/apiAvailability";

export const useWakeUpEdgeFunctions = () => {
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);

  const wakeUpEdgeFunctions = useCallback(async () => {
    if (isWakingUp) {
      console.log("Réveil déjà en cours, ignoré...");
      return false;
    }
    
    setIsWakingUp(true);
    
    try {
      console.log("Tentative de réveil des edge functions...");
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("Pas de token d'accès disponible pour le réveil");
        setIsWakingUp(false);
        return false;
      }

      toast.loading("Initialisation des services...", { id: "wake-up-toast" });

      // Séquence de réveil qui utilise le token JWT de Supabase pour les edge functions
      const wakeupSequence = [
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        },
        {
          url: 'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns',
          method: 'OPTIONS',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      ];
      
      const attemptRequest = async (requestConfig: any, retries = 1) => {
        for (let i = 0; i <= retries; i++) {
          try {
            console.log(`Tentative ${i+1} pour ${requestConfig.url}`);
            const response = await fetch(requestConfig.url, {
              method: requestConfig.method,
              headers: requestConfig.headers,
              signal: AbortSignal.timeout(i === 0 ? 5000 : 8000)
            });
            
            console.log(`Réponse pour ${requestConfig.url}: ${response.status} ${response.statusText}`);
            return true;
          } catch (err) {
            console.log(`La requête à ${requestConfig.url} a échoué à la tentative ${i + 1}:`, err.name);
            if (i < retries) {
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        }
        return false;
      };
      
      await Promise.allSettled(wakeupSequence.map(req => attemptRequest(req)));
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const apiStatus = await checkApiAvailability(1, 2000);
      
      if (apiStatus.available) {
        toast.success("Services initialisés avec succès", { id: "wake-up-toast" });
        setIsWakingUp(false);
        return true;
      } else {
        toast.info("Services en cours d'initialisation, veuillez patienter...", { id: "wake-up-toast" });
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const finalCheck = await checkApiAvailability(1, 2000);
        if (finalCheck.available) {
          toast.success("Services initialisés avec succès", { id: "wake-up-toast" });
          setIsWakingUp(false);
          return true;
        } else {
          toast.warning("Initialisation des services en cours, veuillez réessayer plus tard", { id: "wake-up-toast" });
          setIsWakingUp(false);
          return false;
        }
      }
    } catch (error) {
      console.error("Erreur lors du réveil des edge functions:", error);
      toast.error("Erreur lors de l'initialisation des services", { id: "wake-up-toast" });
      setIsWakingUp(false);
      return false;
    }
  }, [isWakingUp]);

  return { wakeUpEdgeFunctions, isWakingUp };
};
