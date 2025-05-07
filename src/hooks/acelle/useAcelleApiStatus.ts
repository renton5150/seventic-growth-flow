
import { useState, useEffect, useCallback } from 'react';
import { useAuthToken } from './useAuthToken';
import { wakeupCorsProxy, getAuthToken, forceRefreshAuthToken } from '@/services/acelle/cors-proxy';
import { toast } from 'sonner';

/**
 * Hook pour surveiller et contrôler l'état des API Acelle
 * Centralise la logique d'état de connexion pour toute l'application
 */
export const useAcelleApiStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isProxyAvailable, setIsProxyAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [checkCounter, setCheckCounter] = useState(0);
  
  // On vérifie l'état du système au démarrage et périodiquement
  useEffect(() => {
    // Vérification au chargement
    checkSystem();
    
    // Vérification périodique
    const intervalId = setInterval(() => {
      checkSystem({ quietMode: true });
    }, 5 * 60 * 1000); // Toutes les 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);
  
  /**
   * Vérifie l'état de l'authentification et des proxies
   */
  const checkSystem = useCallback(async (options?: { quietMode?: boolean }) => {
    const quietMode = options?.quietMode || false;
    
    try {
      setIsChecking(true);
      
      if (!quietMode) {
        setAuthError(null);
        setProxyError(null);
      }
      
      // 1. Vérifier l'authentification
      const token = await getAuthToken();
      setIsAuthenticated(!!token);
      
      if (!token) {
        setAuthError("Session expirée. Veuillez vous reconnecter.");
        setIsProxyAvailable(false);
        return false;
      }
      
      // 2. Tenter de réveiller les proxies pour vérifier leur disponibilité
      const proxyAwake = await wakeupCorsProxy(token);
      setIsProxyAvailable(proxyAwake);
      
      if (!proxyAwake) {
        setProxyError("Les services API ne répondent pas correctement.");
      }
      
      setLastCheck(new Date());
      setCheckCounter(prev => prev + 1);
      
      return proxyAwake && !!token;
    } catch (error) {
      console.error("Erreur lors de la vérification du système:", error);
      
      if (!quietMode) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        toast.error(`Erreur de connexion: ${errorMessage}`);
      }
      
      setIsAuthenticated(false);
      setIsProxyAvailable(false);
      
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);
  
  /**
   * Force la vérification et la correction de l'état du système
   */
  const forceRefresh = useCallback(async (): Promise<boolean> => {
    try {
      setIsChecking(true);
      setAuthError(null);
      setProxyError(null);
      toast.loading("Rafraîchissement des services...", { id: "refresh-services" });
      
      // 1. Forcer le rafraîchissement du token
      const newToken = await forceRefreshAuthToken();
      setIsAuthenticated(!!newToken);
      
      if (!newToken) {
        setAuthError("Impossible d'obtenir un token d'authentification valide.");
        toast.error("Erreur d'authentification", { id: "refresh-services" });
        return false;
      }
      
      // 2. Forcer le réveil des services avec le nouveau token
      const proxyAwake = await wakeupCorsProxy(newToken);
      setIsProxyAvailable(proxyAwake);
      
      if (!proxyAwake) {
        setProxyError("Impossible de réveiller les services API.");
        toast.error("Services API indisponibles", { id: "refresh-services" });
        return false;
      }
      
      setLastCheck(new Date());
      toast.success("Services connectés avec succès", { id: "refresh-services" });
      
      // Incrémenter le compteur pour forcer la mise à jour des composants
      setCheckCounter(prev => prev + 1);
      
      return true;
    } catch (error) {
      console.error("Erreur lors du rafraîchissement forcé:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Erreur: ${errorMessage}`, { id: "refresh-services" });
      
      setIsAuthenticated(false);
      setIsProxyAvailable(false);
      
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);
  
  return {
    isAuthenticated,
    isProxyAvailable,
    isChecking,
    lastCheck,
    checkCounter,
    authError,
    proxyError,
    checkSystem,
    forceRefresh
  };
};
