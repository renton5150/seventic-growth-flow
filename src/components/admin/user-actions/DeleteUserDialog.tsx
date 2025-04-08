
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { User } from "@/types/types";
import { deleteUser } from "@/services/user";
import { toast } from "sonner";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  isDeleting: boolean;
  setIsDeleting: (value: boolean) => void;
  onUserDeleted: () => void;
}

export const DeleteUserDialog = ({
  isOpen,
  onOpenChange,
  user,
  isDeleting,
  setIsDeleting,
  onUserDeleted
}: DeleteUserDialogProps) => {
  
  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);
      
      // Afficher un toast de chargement persistant avec ID
      const toastId = toast.loading(`Suppression de l'utilisateur ${user.name}...`);
      
      const { success, error, warning } = await deleteUser(user.id);
      
      // Fermer le toast de chargement
      toast.dismiss(toastId);
      
      if (success) {
        if (warning) {
          // Afficher un avertissement si la suppression a des problèmes mineurs
          toast.success(`L'utilisateur ${user.name} a été marqué pour suppression`, {
            description: warning,
            duration: 5000
          });
        } else {
          toast.success(`L'utilisateur ${user.name} a été supprimé avec succès`);
        }
        // Dans tous les cas, considérer l'opération comme réussie pour l'interface
        onUserDeleted();
      } else {
        toast.error(`Erreur: ${error || "Une erreur est survenue lors de la suppression de l'utilisateur"}`);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      toast.error("Une erreur est survenue lors de la suppression de l'utilisateur");
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
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
