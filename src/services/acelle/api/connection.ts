
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie la connexion à l'API Acelle
 */
export const checkAcelleConnectionStatus = async (
  account: AcelleAccount,
  accessToken?: string | null
): Promise<AcelleConnectionDebug> => {
  try {
    if (!account || !account.api_endpoint || !account.api_token) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: "Informations de connexion insuffisantes"
      };
    }

    // Récupérer le token d'authentification si non fourni
    if (!accessToken) {
      const { data } = await supabase.auth.getSession();
      accessToken = data?.session?.access_token;
      
      if (!accessToken) {
        return {
          success: false,
          timestamp: new Date().toISOString(),
          errorMessage: "Aucun token d'authentification disponible"
        };
      }
    }
    
    // Essayer d'appeler l'Edge Function pour vérifier la connexion à Acelle
    try {
      // Construire l'URL pour la vérification
      const url = new URL(`https://dupguifqyjchlmzbadav.supabase.co/functions/v1/check-acelle-api`);
      url.searchParams.append("url", account.api_endpoint);
      url.searchParams.append("token", account.api_token);
      
      // Effectuer la requête
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          timestamp: new Date().toISOString(),
          errorMessage: `Erreur HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          timestamp: new Date().toISOString(),
          errorMessage: result.errorMessage || "La vérification de l'API a échoué"
        };
      }
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        responseTime: result.responseTime,
        apiVersion: result.apiVersion
      };
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Test la connexion à Acelle avec un compte test
 */
export const testAcelleConnection = async (
  api_endpoint: string,
  api_token: string,
  accessToken?: string | null
): Promise<AcelleConnectionDebug> => {
  // Créer un compte test pour la vérification
  const testAccount: AcelleAccount = {
    id: 'test',
    name: 'Test Connection',
    api_endpoint,
    api_token,
    status: 'inactive',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cache_priority: 0,
    last_sync_date: null,
    last_sync_error: null
  };
  
  return await checkAcelleConnectionStatus(testAccount, accessToken);
};
