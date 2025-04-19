
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { User } from "@/types/types";
import { deleteUser } from "@/services/user";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onUserDeleted: () => void;
}

export const DeleteUserDialog = ({
  isOpen,
  onOpenChange,
  user,
  onUserDeleted
}: DeleteUserDialogProps) => {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDeleteUser = async () => {
    if (isDeleting) return;
    
    try {
      // Set deleting state
      setIsDeleting(true);
      
      // Close dialog first before performing the operation
      onOpenChange(false);
      
      // Wait for dialog to close
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Show loading toast
      const toastId = toast.loading(`Suppression de l'utilisateur ${user.name}...`);
      
      // Perform deletion after dialog is closed
      const { success, error, warning } = await deleteUser(user.id);
      
      if (success) {
        toast.dismiss(toastId);
        
        toast.success(warning 
          ? `Utilisateur ${user.name} marqué pour suppression`
          : `Utilisateur ${user.name} supprimé avec succès`
        );
        
        // Refresh data
        queryClient.invalidateQueries({ 
          queryKey: ['admin-users']
        });
        
        // Notify parent after a small delay
        setTimeout(() => onUserDeleted(), 500);
      } else {
        toast.dismiss(toastId);
        toast.error(`Erreur: ${error || "Une erreur est survenue"}`);
      }
    } catch (error) {
      console.error("Erreur critique lors de la suppression:", error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      // Reset deleting state with a delay
      setTimeout(() => setIsDeleting(false), 300);
    }
  };
  
  return (
    <AlertDialog 
      open={isOpen}
      onOpenChange={(open) => {
        if (!isDeleting) {
          onOpenChange(open);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer l'utilisateur {user.name} ({user.email}) ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDeleteUser();
            }}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Suppression en cours...
              </>
            ) : (
              'Supprimer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
