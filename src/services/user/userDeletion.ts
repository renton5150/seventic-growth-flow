
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Supprimer un utilisateur - version simplifiée et plus robuste
export const deleteUser = async (userId: string): Promise<ActionResponse> => {
  console.log("Tentative de suppression de l'utilisateur:", userId);
  
  try {
    // Vérification simple de l'ID utilisateur
    if (!userId || !userId.includes("-")) {
      console.error("ID d'utilisateur invalide:", userId);
      return { success: false, error: "ID d'utilisateur invalide" };
    }
    
    // Appel direct et simplifié à la fonction Edge
    const response = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });
    
    console.log("Réponse de la fonction delete-user:", response);
    
    // Vérification simplifiée de la réponse
    if (response.error) {
      console.error("Erreur lors de la suppression:", response.error);
      return { 
        success: false, 
        error: response.error.message || "Erreur lors de la suppression" 
      };
    }
    
    // Considérer toute réponse sans erreur comme un succès
    return { success: true };
  } catch (error) {
    // Gestion d'erreur simplifiée
    console.error("Exception lors de la suppression:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  }
};
