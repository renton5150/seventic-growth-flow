
import { useState, useEffect } from 'react';
import { useEdgeFunctionWakeup } from './useEdgeFunctionWakeup';
import { useAuthToken } from './useAuthToken';
import { toast } from 'sonner';

/**
 * Hook pour gérer la disponibilité des services
 * 
 * Vérifie et assure que les Edge Functions nécessaires sont réveillées
 * avant d'effectuer des opérations critiques.
 */
export const useServiceAvailability = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [areServicesAvailable, setServicesAvailable] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  
  const { authToken, getValidAuthToken } = useAuthToken();
  const { wakeUpAllServices, wakeupStatus } = useEdgeFunctionWakeup();
  
  // Vérification initiale des services au chargement
  useEffect(() => {
    const checkInitialAvailability = async () => {
      // Si nous avons déjà fait une vérification récemment, ne pas en refaire une
      if (lastCheck && (Date.now() - lastCheck.getTime()) < 60000) {
        return;
      }
      
      await ensureServicesAvailable();
    };
    
    // Ne vérifier automatiquement qu'au chargement initial
    if (!lastCheck) {
      checkInitialAvailability();
    }
  }, [lastCheck]);
  
  /**
   * Vérifie que tous les services nécessaires sont disponibles
   */
  const checkServicesAvailability = async (): Promise<boolean> => {
    setIsChecking(true);
    
    try {
      // Vérifier que nous avons un token d'authentification valide
      const token = authToken || await getValidAuthToken();
      
      if (!token) {
        console.error("Pas de token d'authentification disponible");
        setServicesAvailable(false);
        return false;
      }
      
      // Tenter de réveiller tous les services
      const result = await wakeUpAllServices(token);
      
      setServicesAvailable(result);
      setLastCheck(new Date());
      
      return result;
    } catch (error) {
      console.error("Erreur lors de la vérification de la disponibilité des services:", error);
      setServicesAvailable(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };
  
  /**
   * S'assure que les services sont disponibles avant de continuer
   * 
   * @param forceRefresh - Force une nouvelle vérification même si la dernière est récente
   * @returns Promise<boolean> - true si les services sont disponibles
   */
  const ensureServicesAvailable = async (forceRefresh: boolean = false): Promise<boolean> => {
    // Si une vérification est en cours, attendre qu'elle se termine
    if (isChecking) {
      console.log("Vérification de services déjà en cours, attente...");
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!isChecking) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });
      return areServicesAvailable;
    }
    
    // Si nous avons déjà vérifié récemment et que nous n'avons pas besoin de forcer
    if (!forceRefresh && lastCheck && (Date.now() - lastCheck.getTime()) < 60000 && areServicesAvailable) {
      console.log("Services déjà vérifiés récemment et disponibles");
      return true;
    }
    
    // Sinon, faire une nouvelle vérification
    console.log("Vérification de la disponibilité des services...");
    return await checkServicesAvailability();
  };
  
  /**
   * Force le réveil des services et affiche des notifications à l'utilisateur
   */
  const forceWakeupServices = async (): Promise<boolean> => {
    toast.loading("Réveil des services en cours...", { id: "force-wakeup" });
    
    try {
      const result = await ensureServicesAvailable(true);
      
      if (result) {
        toast.success("Services réveillés avec succès", { id: "force-wakeup" });
      } else {
        toast.error("Impossible de réveiller les services", { id: "force-wakeup" });
      }
      
      return result;
    } catch (error) {
      console.error("Erreur lors du réveil forcé des services:", error);
      toast.error("Erreur lors du réveil des services", { id: "force-wakeup" });
      return false;
    }
  };
  
  return {
    isChecking,
    areServicesAvailable,
    lastCheck,
    wakeupStatus,
    ensureServicesAvailable,
    forceWakeupServices
  };
};
