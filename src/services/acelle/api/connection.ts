
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { supabase } from '@/integrations/supabase/client';
import { wakeupCorsProxy, getAuthToken, fetchViaProxy } from "../cors-proxy";
import { toast } from 'sonner';

/**
 * Teste la connexion à l'API Acelle avec gestion améliorée des erreurs
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
    
    // Construire l'URL pour tester la connexion - commence par tester ping qui est plus fiable
    console.log(`Test d'API pour ${account.name} avec endpoint ${account.api_endpoint}`);
    
    const startTime = Date.now();
    
    try {
      // Utiliser notre nouveau système de fetch unifié pour une gestion plus robuste des erreurs
      const response = await fetchViaProxy(
        "ping",
        { method: "GET" },
        account.api_token,
        account.api_endpoint,
        2 // Nombre de tentatives max
      );
      
      const duration = Date.now() - startTime;
      
      // Si la réponse n'est pas ok
      if (!response.ok) {
        const errorText = await response.text();
        
        console.error(`Erreur API: ${response.status} - ${response.statusText}`, {
          errorText
        });
        
        // Si c'est une erreur 404, c'est peut-être parce que l'endpoint /ping n'existe pas
        // Essayons avec campaigns qui devrait toujours exister
        if (response.status === 404) {
          return await testAcelleConnectionWithCampaigns(account, authToken);
        }
        
        return {
          success: false,
          errorMessage: `Erreur API ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
          accountName: account.name,
          statusCode: response.status,
          duration,
          request: {
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
      console.error("Erreur lors de la requête API:", fetchError);
      
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

/**
 * Teste la connexion à l'API Acelle en utilisant l'endpoint /campaigns
 * Cette fonction est utilisée comme fallback si /ping ne fonctionne pas
 */
async function testAcelleConnectionWithCampaigns(
  account: AcelleAccount, 
  authToken: string
): Promise<AcelleConnectionDebug> {
  console.log(`Test de connexion avec l'endpoint /campaigns pour ${account.name}...`);
  
  try {
    const startTime = Date.now();
    
    // Utiliser notre système de fetch unifié avec l'endpoint campaigns
    const response = await fetchViaProxy(
      "campaigns?page=1&per_page=1",
      { method: "GET" },
      account.api_token,
      account.api_endpoint,
      2 // Nombre de tentatives max
    );
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      
      console.error(`Erreur API (campaigns): ${response.status} - ${response.statusText}`, {
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
          method: "GET"
        },
        responseData: {
          error: true,
          message: errorText
        }
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      accountName: account.name,
      version: "Vérifiée via /campaigns",
      timestamp: new Date().toISOString(),
      statusCode: response.status,
      duration,
      request: {
        method: "GET"
      },
      responseData: Array.isArray(data) ? { count: data.length } : data
    };
  } catch (error) {
    console.error("Erreur lors du test de connexion via campaigns:", error);
    
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      accountName: account.name
    };
  }
}
