
import { useState } from "react";
import { deleteUser } from "@/services/user";
import { toast } from "sonner";
import { User } from "@/types/types";

export const useDeleteUser = (user: User, onActionComplete: () => void) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);
      toast.loading(`Suppression de l'utilisateur ${user.name}...`);
      
      const { success, error } = await deleteUser(user.id);
      
      if (success) {
        toast.success(`L'utilisateur ${user.name} a été supprimé avec succès`);
        onActionComplete();
      } else {
        toast.error(`Erreur: ${error || "Une erreur est survenue lors de la suppression de l'utilisateur"}`);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      toast.error("Une erreur est survenue lors de la suppression de l'utilisateur");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDeleteUser
  };
};
