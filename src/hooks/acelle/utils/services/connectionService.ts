
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
    
    return makeApiRequest({
      endpoint: account.api_endpoint,
      token: account.api_token,
      accountName: account.name
    });
  } catch (error) {
    console.error("Erreur lors du test de connexion API:", error);
    return { success: false, error: error.message };
  }
};

