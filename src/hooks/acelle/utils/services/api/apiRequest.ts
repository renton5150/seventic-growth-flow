
import { AcelleConnectionResponse } from "../../types/apiTypes";
import { ACELLE_PROXY_BASE_URL, API_TIMEOUT } from "../../config/acelleApiConfig";

interface ApiRequestParams {
  endpoint: string;
  token: string;
  accountName?: string;
}

export const makeApiRequest = async (params: ApiRequestParams): Promise<AcelleConnectionResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    console.log(`Envoi de la requête API à ${params.endpoint} via le proxy ${ACELLE_PROXY_BASE_URL}`);
    
    // Nettoyage de l'URL pour éviter les problèmes de slash
    const cleanEndpoint = params.endpoint.endsWith('/') ? 
      params.endpoint.slice(0, -1) : params.endpoint;
    
    const response = await fetch(
      `${ACELLE_PROXY_BASE_URL}/test-acelle-connection`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'x-acelle-endpoint': cleanEndpoint,
          'x-acelle-token': params.token
        },
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    // Log détaillé pour le débogage
    console.log(`Réponse API reçue: status ${response.status}`);
    
    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = errorData.message || `Erreur ${response.status}`;
        console.error("Détails de l'erreur API:", errorData);
      } catch (e) {
        errorText = await response.text();
        console.error("Erreur API brute:", errorText);
      }
      
      return {
        success: false,
        statusCode: response.status,
        error: errorText,
        account: params.accountName,
        endpoint: cleanEndpoint
      };
    }
    
    const result = await response.json();
    console.log("Données API reçues:", result);
    
    return {
      success: result.success,
      data: result,
      account: params.accountName,
      endpoint: cleanEndpoint
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === "AbortError") {
      console.error("Délai d'attente dépassé pour la requête API");
      return {
        success: false,
        error: "Délai d'attente dépassé lors du test de connexion",
        account: params.accountName,
        endpoint: params.endpoint
      };
    }
    
    console.error("Erreur lors de la requête API:", error);
    return {
      success: false,
      error: error.message,
      account: params.accountName,
      endpoint: params.endpoint
    };
  }
};
