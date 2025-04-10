
import { invalidateUserCache } from "./userQueries";

// Re-export user management functions from modularized files
export { deleteUser } from "./userDeletion";
export { resendInvitation } from "./userInvitation";

// Export the cache invalidation function
export { invalidateUserCache };

// Utility function to update a user's role with optimized performance
export const updateUserRole = async (userId: string, newRole: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    
    console.log(`Updating role for user ${userId} to ${newRole}`);
    
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
      
    if (error) {
      console.error("Role update error:", error);
      return { success: false, error: error.message };
    }
    
    // Invalidate the user cache to ensure fresh data
    invalidateUserCache();
    
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error("Unexpected error updating role:", error);
    return { success: false, error: error.message };
  }
};
