
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

      const syncResponse = await fetch('https://dupguifqyjchlmzbadav.supabase.co/functions/v1/sync-email-campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({
          forceSync: true
        })
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
      toast.error("Erreur lors de la synchronisation");
      return { error: `Erreur: ${error.message}` };
    }
  };

  return { syncCampaignsCache };
};
