
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
    const response = await fetch(
      `${ACELLE_PROXY_BASE_URL}/test-acelle-connection`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'x-acelle-endpoint': params.endpoint,
          'x-acelle-token': params.token
        },
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = errorData.message || `Error ${response.status}`;
      } catch (e) {
        errorText = await response.text();
      }
      
      return {
        success: false,
        statusCode: response.status,
        error: errorText,
        account: params.accountName
      };
    }
    
    const result = await response.json();
    return {
      success: result.success,
      data: result,
      account: params.accountName,
      endpoint: params.endpoint
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "Délai d'attente dépassé lors du test de connexion",
        account: params.accountName
      };
    }
    
    return {
      success: false,
      error: error.message,
      account: params.accountName
    };
  }
};

