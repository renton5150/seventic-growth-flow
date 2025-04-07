
import { supabase } from "@/integrations/supabase/client";
import { ActionResponse } from "./types";

// Supprimer un utilisateur
export const deleteUser = async (userId: string): Promise<ActionResponse> => {
  console.log("Tentative de suppression de l'utilisateur:", userId);
  
  try {
    // Appeler la fonction Edge
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });
    
    if (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Utilisateur supprimé avec succès:", userId);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Exception lors de la suppression de l'utilisateur:", error);
    
    return { success: false, error: errorMessage };
  }
};

// Renvoyer une invitation
export const resendInvitation = async (email: string): Promise<ActionResponse> => {
  console.log("Tentative de renvoi d'invitation à:", email);
  
  try {
    // Ajout d'un timeout plus long pour les opérations d'invitation
    const timeoutPromise = new Promise<ActionResponse>((_, reject) => {
      setTimeout(() => reject(new Error("L'opération a expiré après 20 secondes")), 20000);
    });
    
    const invocationPromise = new Promise<ActionResponse>(async (resolve) => {
      try {
        // Appeler la fonction Edge
        const { data, error } = await supabase.functions.invoke('resend-invitation', {
          body: { email }
        });
        
        if (error) {
          console.error("Erreur lors du renvoi de l'invitation:", error);
          resolve({ success: false, error: error.message });
          return;
        }
        
        console.log("Réponse de la fonction resend-invitation:", data);
        
        if (data && data.success === false) {
          console.error("Erreur serveur:", data.error);
          resolve({ success: false, error: data.error || "Erreur serveur inconnue" });
          return;
        }
        
        console.log("Invitation renvoyée avec succès à:", email);
        resolve({ success: true });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        console.error("Exception dans invocationPromise:", err);
        resolve({ success: false, error: errorMessage });
      }
    });
    
    // Utiliser Promise.race pour gérer le timeout
    return await Promise.race([invocationPromise, timeoutPromise]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Exception lors du renvoi de l'invitation:", error);
    
    return { success: false, error: errorMessage };
  }
};
