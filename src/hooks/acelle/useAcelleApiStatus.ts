
import { useState, useEffect, useCallback } from 'react';
import { getAuthToken, wakeupCorsProxy, forceRefreshAuthToken, setupHeartbeatService } from '@/services/acelle/cors-proxy';
import { toast } from 'sonner';

/**
 * Hook pour surveiller et gérer l'état global de l'API Acelle
 * Fournit des fonctionnalités de diagnostic et de réveil des services
 */
export function useAcelleApiStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isProxyAvailable, setIsProxyAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [proxyError, setProxyError] = useState<string | null>(null);

  // Vérifie l'état d'authentification
  const checkAuthentication = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getAuthToken();
      const isAuth = !!token;
      setIsAuthenticated(isAuth);
      
      if (!isAuth) {
        setAuthError("Session non authentifiée");
      } else {
        setAuthError(null);
      }
      
      return isAuth;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error);
      setAuthError("Erreur lors de la vérification de l'authentification");
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // Vérifie la disponibilité du proxy
  const checkProxyAvailability = useCallback(async (): Promise<boolean> => {
    try {
      setIsChecking(true);
      
      const token = await getAuthToken();
      if (!token) {
        setProxyError("Authentification requise");
        setIsProxyAvailable(false);
        return false;
      }
      
      const isAvailable = await wakeupCorsProxy(token);
      setIsProxyAvailable(isAvailable);
      setLastCheck(new Date());
      
      if (!isAvailable) {
        setProxyError("Les services ne répondent pas");
      } else {
        setProxyError(null);
      }
      
      return isAvailable;
    } catch (error) {
      console.error("Erreur lors de la vérification du proxy:", error);
      setProxyError("Erreur lors de la vérification des services");
      setIsProxyAvailable(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Vérifie le système complet
  const checkSystem = useCallback(async (): Promise<{
    isAuthenticated: boolean;
    isProxyAvailable: boolean;
  }> => {
    const authStatus = await checkAuthentication();
    const proxyStatus = authStatus ? await checkProxyAvailability() : false;
    
    return {
      isAuthenticated: authStatus,
      isProxyAvailable: proxyStatus
    };
  }, [checkAuthentication, checkProxyAvailability]);

  // Force un rafraîchissement complet du système
  const forceRefresh = useCallback(async (): Promise<boolean> => {
    try {
      toast.loading("Rafraîchissement du système...", { id: "system-refresh" });
      
      // Forcer un nouveau token
      const token = await forceRefreshAuthToken();
      if (!token) {
        toast.error("Échec du rafraîchissement de la session", { id: "system-refresh" });
        return false;
      }
      
      // Réveiller tous les services
      const proxyStatus = await wakeupCorsProxy(token);
      setRefreshCount(prev => prev + 1);
      
      if (proxyStatus) {
        toast.success("Système rafraîchi avec succès", { id: "system-refresh" });
      } else {
        toast.error("Échec partiel du rafraîchissement", { id: "system-refresh" });
      }
      
      // Mettre à jour les états
      setIsAuthenticated(true);
      setIsProxyAvailable(proxyStatus);
      setLastCheck(new Date());
      
      return proxyStatus;
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      toast.error("Erreur lors du rafraîchissement", { id: "system-refresh" });
      return false;
    }
  }, []);

  // Au montage, configurer la vérification automatique et le heartbeat
  useEffect(() => {
    // Vérification initiale
    checkSystem();
    
    // Configuration du heartbeat
    const cleanupHeartbeat = setupHeartbeatService();
    
    // Vérification périodique
    const intervalId = setInterval(() => {
      checkSystem();
    }, 3 * 60 * 1000); // toutes les 3 minutes
    
    return () => {
      clearInterval(intervalId);
      cleanupHeartbeat();
    };
  }, [checkSystem]);

  return {
    isAuthenticated,
    isProxyAvailable,
    isChecking,
    lastCheck,
    refreshCount,
    authError,
    proxyError,
    checkAuthentication,
    checkProxyAvailability,
    checkSystem,
    forceRefresh
  };
}
