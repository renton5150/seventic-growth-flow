
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "./types";
import { CreateUserResponse } from "./types";

export const createUser = async (
  email: string, 
  name: string, 
  role: UserRole
): Promise<CreateUserResponse> => {
  try {
    console.log("🚀 Création utilisateur:", { email, name, role });
    
    // Utiliser la nouvelle fonction simple
    const { data, error } = await supabase.functions.invoke('simple-email-invite', { 
      body: { 
        email: email,
        userName: name,
        userRole: role
      }
    });
    
    console.log("📥 Réponse création utilisateur:", JSON.stringify(data, null, 2));
    
    if (error) {
      console.error("❌ Erreur création utilisateur:", error);
      return { success: false, error: error.message || "Erreur lors de la création" };
    }
    
    if (!data || data.success === false) {
      console.error("❌ Échec création utilisateur:", data);
      return { success: false, error: data?.error || "Échec création utilisateur" };
    }
    
    console.log("✅ Utilisateur créé avec succès:", email);
    return { 
      success: true,
      user: {
        id: data.data?.user?.id || 'pending',
        email: email,
        name: name,
        role: role,
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("❌ Exception création utilisateur:", error);
    return { success: false, error: errorMessage };
  }
};
