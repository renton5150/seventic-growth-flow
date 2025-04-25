
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCampaignSync = () => {
  const syncCampaignsCache = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available");
        throw new Error("Authentication required");
      }

      // Utiliser un timeout plus long pour permettre au service de démarrer si besoin
      const syncResponse = await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({
          forceSync: true,
          startServices: true // Nouveau paramètre pour demander le réveil des services
        }),
        // Augmenter le timeout pour laisser le temps aux services de démarrer
        signal: AbortSignal.timeout(30000) // 30 secondes de timeout
      });

      if (!syncResponse.ok) {
        let errorMessage = `Erreur ${syncResponse.status}`;
        try {
          const errorData = await syncResponse.json();
          console.error("Sync error details:", errorData);
          errorMessage += `: ${errorData.error || "Erreur de synchronisation"}`;
        } catch (e) {
          const errorText = await syncResponse.text();
          console.error(`Error syncing campaigns cache: ${syncResponse.status}`, errorText);
        }
        
        toast.error("Erreur lors de la synchronisation des campagnes");
        return { error: errorMessage };
      }

      const syncResult = await syncResponse.json();
      console.log("Sync result:", syncResult);
      
      const failedAccounts = syncResult.results?.filter((r: any) => !r.success);
      if (failedAccounts && failedAccounts.length > 0) {
        console.warn("Some accounts failed to sync:", failedAccounts);
        if (failedAccounts.length === syncResult.results.length) {
          const mainError = failedAccounts[0];
          toast.error(`Erreur de synchronisation: ${mainError.error || "Échec de connexion"}`);
          return { error: `Échec de la synchronisation: ${mainError.error || "Problème de connexion API"}` };
        } else {
          toast.warning(`${failedAccounts.length} compte(s) n'ont pas pu être synchronisés`);
        }
      } else {
        toast.success("Synchronisation réussie");
      }

      return { success: true, data: syncResult };
    } catch (error) {
      console.error("Error syncing campaigns cache:", error);
      
      // Vérifier si l'erreur est due à un timeout ou une erreur réseau
      if (error.name === "AbortError" || error.name === "TypeError") {
        toast.error("Impossible de se connecter au service. Tentative de redémarrage...");
        
        // Tentative de réveil des services
        try {
          await wakeUpEdgeFunctions();
        } catch (wakeError) {
          console.error("Erreur lors du réveil des services:", wakeError);
        }
      } else {
        toast.error("Erreur lors de la synchronisation");
      }
      
      return { error: `Erreur: ${error.message}` };
    }
  };

  // Nouvelle fonction pour réveiller les services
  const wakeUpEdgeFunctions = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available for wake up");
        return false;
      }

      // Tenter de ping le service acelle-proxy pour le réveiller
      const wakeUpResponse = await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/me?api_token=ping', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Acelle-Endpoint': 'ping',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // Timeout court car on veut juste réveiller
      }).catch(() => {
        console.log("Première tentative d'éveil échouée, attendu si le service est en shutdown");
        return null;
      });

      // Attendre un peu pour laisser le service démarrer
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.info("Tentative de réveil des services en cours...");
      return true;
    } catch (error) {
      console.error("Erreur lors du réveil des services:", error);
      return false;
    }
  };

  return { syncCampaignsCache, wakeUpEdgeFunctions };
};
