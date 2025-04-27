
import { supabase } from "@/integrations/supabase/client";
import { AcelleConnectionResponse } from "../types/apiTypes";
import { ACELLE_PROXY_BASE_URL, API_TIMEOUT } from "../config/acelleApiConfig";

export const testAcelleConnection = async (accountId?: string): Promise<AcelleConnectionResponse> => {
  try {
    console.log("Test direct de la connexion API Acelle...");
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      console.error("Pas de token d'accès disponible pour le test de connexion API");
      return { success: false, error: "Authentification requise" };
    }
    
    let account = null;
    if (accountId) {
      const { data: accountData } = await supabase
        .from('acelle_accounts')
        .select('*')
        .eq('id', accountId)
        .single();
      
      if (accountData) {
        account = accountData;
      }
    }
    
    if (!account) {
      const { data: accountsData } = await supabase
        .from('acelle_accounts')
        .select('*')
        .eq('status', 'active')
        .limit(1);
      
      if (accountsData && accountsData.length > 0) {
        account = accountsData[0];
      }
    }
    
    if (!account) {
      return { success: false, error: "Aucun compte Acelle actif trouvé" };
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const testResponse = await fetch(
        `${ACELLE_PROXY_BASE_URL}/test-acelle-connection`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'x-acelle-endpoint': account.api_endpoint,
            'x-acelle-token': account.api_token
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!testResponse.ok) {
        let errorText;
        try {
          const errorData = await testResponse.json();
          errorText = errorData.message || `Error ${testResponse.status}`;
        } catch (e) {
          errorText = await testResponse.text();
        }
        
        return {
          success: false,
          statusCode: testResponse.status,
          error: errorText,
          account: account.name
        };
      }
      
      const result = await testResponse.json();
      return {
        success: result.success,
        data: result,
        account: account.name,
        endpoint: account.api_endpoint
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        return {
          success: false,
          error: "Délai d'attente dépassé lors du test de connexion",
          account: account.name
        };
      }
      
      return {
        success: false,
        error: fetchError.message,
        account: account.name
      };
    }
  } catch (error) {
    console.error("Erreur lors du test de connexion API:", error);
    return { success: false, error: error.message };
  }
};
