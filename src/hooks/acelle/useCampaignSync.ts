
import { useCallback, useState } from "react";
import { useWakeUpEdgeFunctions } from "./useWakeUpEdgeFunctions";
import { useCampaignSyncOperation } from "./useCampaignSyncOperation";
import { checkApiAvailability } from "./utils/apiAvailability";
import { toast } from "sonner";

export const useCampaignSync = () => {
  const { wakeUpEdgeFunctions, isWakingUp, wakeUpStatus } = useWakeUpEdgeFunctions();
  const { syncCampaignsCache, isSyncing } = useCampaignSyncOperation();
  const [lastApiCheck, setLastApiCheck] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  // Throttle API availability checks to prevent flooding
  const checkAvailability = useCallback(async (retries = 2, retryDelay = 1500) => {
    setIsInitializing(true);
    const now = Date.now();
    
    // Throttle checks to no more than once every 5 seconds
    if (now - lastApiCheck < 5000 && lastApiCheck > 0) {
      console.log("API check throttled - too many consecutive checks");
      setIsInitializing(false);
      return { available: false, error: "Verification trop fréquente" };
    }
    
    setLastApiCheck(now);
    try {
      toast.loading("Vérification de la connexion API...", { id: "api-check" });
      const result = await checkApiAvailability(retries, retryDelay);
      
      if (result.available) {
        toast.success("Services API accessibles", { id: "api-check" });
      } else {
        toast.error(`Services API non accessibles: ${result.error || "Erreur inconnue"}`, { id: "api-check" });
      }
      
      return result;
    } finally {
      setIsInitializing(false);
    }
  }, [lastApiCheck]);

  // Fonction d'initialisation tout-en-un
  const initializeServices = useCallback(async () => {
    setIsInitializing(true);
    
    try {
      toast.loading("Initialisation des services...", { id: "init-services" });
      
      // Étape 1: Réveiller les edge functions
      await wakeUpEdgeFunctions();
      
      // Étape 2: Attendre un court instant
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Étape 3: Vérifier la disponibilité de l'API
      const apiStatus = await checkApiAvailability(2, 2000);
      
      // Étape 4: Si l'API est disponible, lancer la synchronisation
      if (apiStatus.available) {
        toast.success("Services initialisés avec succès", { id: "init-services" });
        await syncCampaignsCache();
        return true;
      } else {
        toast.error(`Échec de l'initialisation: ${apiStatus.error || "Erreur inconnue"}`, { id: "init-services" });
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation des services:", error);
      toast.error(`Erreur d'initialisation: ${error.message || "Erreur inconnue"}`, { id: "init-services" });
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [wakeUpEdgeFunctions, checkAvailability, syncCampaignsCache]);

  return { 
    syncCampaignsCache, 
    wakeUpEdgeFunctions, 
    checkApiAvailability: checkAvailability,
    initializeServices,
    isSyncing,
    isWakingUp,
    isInitializing: isInitializing || isSyncing || isWakingUp,
    wakeUpStatus
  };
};
