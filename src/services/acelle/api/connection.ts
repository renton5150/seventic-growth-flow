
import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie la disponibilité de l'API Acelle
 */
export const checkApiAvailability = async (accountId: string): Promise<boolean> => {
  try {
    // Utilise l'Edge Function pour vérifier la disponibilité
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: {
        action: 'check-availability',
        accountId
      }
    });

    if (error) {
      console.error("Erreur lors de la vérification de l'API Acelle:", error);
      return false;
    }

    return data?.available === true;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'API Acelle:", error);
    return false;
  }
};

/**
 * Teste la connexion à un compte Acelle
 */
export const testConnection = async (
  apiEndpoint: string,
  apiToken: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Utilise l'Edge Function pour tester la connexion
    const { data, error } = await supabase.functions.invoke('acelle-proxy', {
      body: {
        action: 'test-connection',
        apiEndpoint,
        apiToken
      }
    });

    if (error) {
      console.error("Erreur lors du test de connexion Acelle:", error);
      return { 
        success: false, 
        message: `Erreur: ${error.message}` 
      };
    }

    return data || { 
      success: false, 
      message: "Réponse invalide du serveur" 
    };
  } catch (error) {
    console.error("Erreur lors du test de connexion Acelle:", error);
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}` 
    };
  }
};
