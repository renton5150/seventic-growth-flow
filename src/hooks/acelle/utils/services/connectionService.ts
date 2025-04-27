
import { AcelleConnectionResponse } from "../types/apiTypes";
import { getSessionToken } from "./auth/sessionManager";
import { getActiveAccount } from "./accounts/accountManager";
import { makeApiRequest } from "./api/apiRequest";

export const testAcelleConnection = async (accountId?: string): Promise<AcelleConnectionResponse> => {
  try {
    console.log("Test direct de la connexion API Acelle...");
    
    const accessToken = await getSessionToken();
    
    if (!accessToken) {
      console.error("Pas de token d'accès disponible pour le test de connexion API");
      return { success: false, error: "Authentification requise" };
    }
    
    const account = await getActiveAccount(accountId);
    
    if (!account) {
      return { success: false, error: "Aucun compte Acelle actif trouvé" };
    }
    
    // Vérification des valeurs d'API
    if (!account.apiEndpoint || !account.apiToken) {
      console.error("Configuration API incorrecte pour le compte:", account.name);
      return { 
        success: false, 
        error: "Configuration API incorrecte", 
        details: "L'endpoint API ou le token est manquant",
        account: account.name
      };
    }
    
    // Afficher les détails pour faciliter le débogage
    console.log(`Test de connexion avec: ${account.name}`);
    console.log(`Endpoint: ${account.apiEndpoint}`);
    console.log(`Token: ${account.apiToken.substring(0, 10)}...`);
    
    const response = await makeApiRequest({
      endpoint: account.apiEndpoint,
      token: account.apiToken,
      accountName: account.name
    });
    
    console.log("Résultat du test de connexion:", response);
    return response;
  } catch (error) {
    console.error("Erreur lors du test de connexion API:", error);
    return { success: false, error: error.message };
  }
};
