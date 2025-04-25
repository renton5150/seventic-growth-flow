
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount } from "@/types/acelle.types";

export const useCampaignSync = () => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Les URL d'edge functions
  const syncUrl = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns";
  const proxyUrl = "https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy";
  
  const wakeUpEdgeFunctions = useCallback(async () => {
    console.log("Tentative de réveil des edge functions...");
    
    try {
      // Fonction pour envoyer une requête ping à une URL d'edge function
      const pingFunction = async (url: string, name: string) => {
        console.log(`Ping de l'edge function ${name}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch(`${url}/wake-up`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache"
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Réponse de ${name}:`, data);
            return true;
          } else {
            console.warn(`Réponse non-OK de ${name}:`, response.status);
            return false;
          }
        } catch (error) {
          clearTimeout(timeoutId);
          console.error(`Erreur lors du ping de ${name}:`, error);
          return false;
        }
      };
      
      // Ping les deux edge functions en parallèle
      const [syncResult, proxyResult] = await Promise.all([
        pingFunction(syncUrl, "sync-email-campaigns"),
        pingFunction(proxyUrl, "acelle-proxy")
      ]);
      
      console.log(`Résultats des pings - sync: ${syncResult}, proxy: ${proxyResult}`);
      
      // Si au moins une fonction est réveillée, on considère que c'est un succès
      return syncResult || proxyResult;
    } catch (error) {
      console.error("Erreur lors du réveil des edge functions:", error);
      return false;
    }
  }, []);

  const syncCampaignsCache = useCallback(async () => {
    console.log("Démarrage de la synchronisation des campagnes...");
    setIsSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("sync-email-campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: {}
      });

      if (error) {
        console.error("Erreur lors de la synchronisation:", error);
        return { error: error.message || "Erreur lors de la synchronisation" };
      }

      if (data?.error) {
        console.error("Erreur retournée par la fonction:", data.error);
        return { error: data.error };
      }

      console.log("Résultat de la synchronisation:", data);
      return { success: true, data };
    } catch (error: any) {
      console.error("Exception lors de la synchronisation:", error);
      return { 
        error: error.message || "Erreur lors de la synchronisation des campagnes" 
      };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    syncCampaignsCache,
    wakeUpEdgeFunctions
  };
};
