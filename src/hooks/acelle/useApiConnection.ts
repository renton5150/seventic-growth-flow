
import { useState, useCallback } from "react";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";

// Hook pour vérifier la connexion à l'API Acelle
export function useApiConnection(account?: AcelleAccount) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<AcelleConnectionDebug | null>(null);

  // Réveille l'edge function avant utilisation
  const wakeUpEdgeFunctions = useCallback(async (token?: string | null) => {
    if (!token) return false;

    try {
      console.log("Réveil des edge functions...");
      
      const response = await fetch(`https://dupguifqyjchlmzbadav.supabase.co/functions/v1/ping`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      console.log("Résultat du réveil:", result);
      
      return result.success;
    } catch (error) {
      console.error("Erreur lors du réveil des edge functions:", error);
      return false;
    }
  }, []);

  // Vérifie si l'API est disponible
  const checkApiAvailability = useCallback(async (token?: string | null) => {
    if (!account || !token) {
      setLastCheckResult(false);
      return false;
    }

    try {
      setIsChecking(true);
      
      // Construire l'URL pour la vérification
      const url = new URL(`https://dupguifqyjchlmzbadav.supabase.co/functions/v1/check-acelle-api`);
      url.searchParams.append("url", account.api_endpoint);
      url.searchParams.append("token", account.api_token); // Transmettre aussi le token dans l'URL
      
      // Effectuer la requête avec double authentification (URL + headers)
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Acelle-Token": account.api_token,
          "X-Acelle-Endpoint": account.api_endpoint
        }
      });
      
      const result = await response.json();
      setLastCheckResult(result.success);
      setDebugInfo(result);
      
      return result.success;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'API:", error);
      setLastCheckResult(false);
      setDebugInfo({
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [account]);

  // Récupère des informations de diagnostic
  const getDebugInfo = useCallback(async (token?: string | null): Promise<AcelleConnectionDebug> => {
    if (!account || !token) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: "Aucun compte ou token fourni"
      };
    }

    try {
      // Construire l'URL pour la vérification
      const url = new URL(`https://dupguifqyjchlmzbadav.supabase.co/functions/v1/check-acelle-api`);
      url.searchParams.append("url", account.api_endpoint);
      url.searchParams.append("token", account.api_token);
      url.searchParams.append("detailed", "true");
      
      // Effectuer la requête avec double authentification (URL + headers)
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Acelle-Token": account.api_token,
          "X-Acelle-Endpoint": account.api_endpoint
        }
      });
      
      const result = await response.json();
      setDebugInfo(result);
      return result;
    } catch (error) {
      console.error("Erreur lors de la récupération des infos de diagnostic:", error);
      const errorInfo = {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      setDebugInfo(errorInfo);
      return errorInfo;
    }
  }, [account]);

  return {
    isChecking,
    lastCheckResult,
    wakeUpEdgeFunctions,
    checkApiAvailability,
    getDebugInfo,
    debugInfo
  };
}
