
import { supabase } from "@/integrations/supabase/client";

export const checkApiAvailability = async (retries = 2, retryDelay = 1500) => {
  try {
    console.log("Vérification de la disponibilité de l'API...");
    
    // Obtenir le token d'accès Supabase
    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    
    if (!accessToken) {
      console.error("Pas de token d'accès disponible pour la vérification de l'API");
      return { available: false, error: "Authentification requise" };
    }
    
    let attempt = 0;
    let lastError = null;
    
    while (attempt <= retries) {
      console.log(`Tentative #${attempt + 1} de vérification de l'API`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        console.log("Envoi de la requête ping avec Supabase token:", accessToken.substring(0, 15) + "...");
        
        // Utiliser le Supabase token pour appeler notre Edge Function
        const pingResponse = await fetch(
          'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/ping', 
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        console.log(`Réponse ping reçue: ${pingResponse.status} ${pingResponse.statusText}`);
        
        if (pingResponse.ok) {
          const pingData = await pingResponse.json();
          console.log("Ping réussi, statut du service:", pingData);
          return { available: true, data: pingData };
        } else {
          console.warn(`Le ping a renvoyé un statut non-200: ${pingResponse.status}`);
          
          try {
            const errorData = await pingResponse.json();
            console.warn("Réponse d'erreur de ping:", errorData);
            lastError = errorData;
          } catch (e) {
            console.warn("Impossible d'analyser la réponse d'erreur de ping");
            lastError = { status: pingResponse.status };
          }
          
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, retryDelay));
            attempt++;
            continue;
          }
          
          return { available: false, error: lastError };
        }
      } catch (pingError) {
        clearTimeout(timeoutId);
        console.error(`Échec de la tentative de ping #${attempt + 1}:`, pingError);
        lastError = pingError;
        
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, retryDelay));
          attempt++;
          continue;
        }
        
        return { available: false, error: pingError.message };
      }
    }
    
    return { available: false, error: lastError?.message || "Nombre maximal de tentatives atteint" };
  } catch (error) {
    console.error("Erreur lors de la vérification de la disponibilité de l'API:", error);
    return { available: false, error: error.message };
  }
};

// Add a function to directly test the Acelle API connection
export const testAcelleConnection = async (accountId?: string) => {
  try {
    console.log("Test direct de la connexion API Acelle...");
    
    // Get Supabase access token
    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    
    if (!accessToken) {
      console.error("Pas de token d'accès disponible pour le test de connexion API");
      return { success: false, error: "Authentification requise" };
    }
    
    // If accountId is provided, get that specific account
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
    
    // If no account is found or no accountId was provided, get the first active account
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
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const testResponse = await fetch(
        'https://dupguifqyjchlmzbadav.supabase.co/functions/v1/acelle-proxy/test-acelle-connection',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
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
