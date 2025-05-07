
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { buildProxyUrl } from "../acelle-service";
import { supabase } from '@/integrations/supabase/client';
import { wakeupCorsProxy, getAuthToken } from "../cors-proxy";
import { toast } from 'sonner';

/**
 * Teste la connexion à l'API Acelle avec une gestion améliorée des erreurs
 */
export const testAcelleConnection = async (account: AcelleAccount): Promise<AcelleConnectionDebug> => {
  console.log(`Test de connexion à l'API Acelle pour ${account.name}...`);
  
  try {
    if (!account.api_endpoint || !account.api_token) {
      return {
        success: false,
        errorMessage: "URL de l'API ou token manquant",
        timestamp: new Date().toISOString(),
        accountName: account.name
      };
    }
    
    // Obtenir un token d'authentification à jour
    const authToken = await getAuthToken();
    if (!authToken) {
      return {
        success: false,
        errorMessage: "Impossible de récupérer le token d'authentification",
        timestamp: new Date().toISOString(),
        accountName: account.name
      };
    }
    
    // Réveiller le proxy avec gestion des erreurs
    const proxyWakeupSuccess = await wakeupCorsProxy(authToken);
    if (!proxyWakeupSuccess) {
      return {
        success: false,
        errorMessage: "Impossible de réveiller le proxy CORS",
        timestamp: new Date().toISOString(),
        accountName: account.name
      };
    }
    
    // Construire l'URL pour tester la connexion (endpoint /me)
    const apiPath = "me";
    const url = buildProxyUrl(apiPath);
    
    console.log(`Test d'API avec URL: ${url}`, {
      endpoint: account.api_endpoint,
      hasToken: !!account.api_token
    });
    
    const startTime = Date.now();
    
    // Effectuer la requête avec un timeout explicite
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes max
    
    try {
      // Effectuer la requête
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Acelle-Token": account.api_token,
          "X-Acelle-Endpoint": account.api_endpoint,
          "Authorization": `Bearer ${authToken}`,
          "X-Request-ID": `test_${Date.now()}`,
          "Cache-Control": "no-cache, no-store, must-revalidate"
        },
        cache: "no-store"
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      // Si le statut n'est pas OK
      if (!response.ok) {
        const errorText = await response.text();
        
        console.error(`Erreur API: ${response.status} - ${response.statusText}`, {
          url,
          errorText
        });
        
        return {
          success: false,
          errorMessage: `Erreur API ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
          accountName: account.name,
          statusCode: response.status,
          duration,
          request: {
            url,
            method: "GET"
          },
          responseData: {
            error: true,
            message: errorText
          }
        };
      }
      
      // Analyser la réponse JSON
      const data = await response.json();
      
      if (!data) {
        return {
          success: false,
          errorMessage: "Réponse JSON invalide",
          timestamp: new Date().toISOString(),
          accountName: account.name,
          statusCode: response.status,
          duration,
          request: {
            url,
            method: "GET"
          },
          responseData: null
        };
      }
      
      // Vérifier si la réponse indique une erreur
      if (data.error || (data.status && data.status !== "success")) {
        const errorMessage = data.error || data.message || "Erreur inconnue";
        
        return {
          success: false,
          errorMessage,
          timestamp: new Date().toISOString(),
          accountName: account.name,
          statusCode: response.status,
          duration,
          request: {
            url,
            method: "GET"
          },
          responseData: data
        };
      }
      
      // Si tout va bien
      return {
        success: true,
        accountName: data.display_name || data.email || account.name,
        version: data.version || "Inconnue",
        timestamp: new Date().toISOString(),
        statusCode: response.status,
        duration,
        request: {
            url,
            method: "GET",
            headers: {
              "X-Acelle-Token": "***", // Masquer le token pour la sécurité
              "X-Acelle-Endpoint": account.api_endpoint,
              "Accept": "application/json"
            }
        },
        responseData: data
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Vérifier si c'est une erreur de timeout
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          errorMessage: "Délai d'attente dépassé lors de la connexion à l'API",
          timestamp: new Date().toISOString(),
          accountName: account.name
        };
      }
      
      throw fetchError; // Relancer pour la gestion globale
    }
  } catch (error) {
    console.error("Erreur lors du test de connexion:", error);
    
    // Formater le message d'erreur
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      errorMessage,
      timestamp: new Date().toISOString(),
      accountName: account.name
    };
  }
};
