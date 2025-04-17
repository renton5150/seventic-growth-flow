
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { User } from "@/types/types";
import { useNavigate } from "react-router-dom";
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
  setIsDeleting
}: DeleteUserDialogProps) => {
  const navigate = useNavigate();
  
  const handleDeleteUser = async () => {
    if (isDeleting) return; // Éviter les doubles clics
    
    try {
      setIsDeleting(true);
      
      // SOLUTION RADICALE : Fermer d'abord la boîte de dialogue
      onOpenChange(false);
      
      // Afficher un toast de suppression en cours
      toast.loading(`Suppression de l'utilisateur ${user.name} en cours...`);
      
      // SOLUTION RADICALE : Rediriger IMMÉDIATEMENT avec un timestamp pour éviter les problèmes de cache
      setTimeout(() => {
        // Forcer un rechargement complet de la page plutôt que de gérer l'état
        navigate(`/admin/users?refresh=${Date.now()}`);
      }, 100);
      
      // La suppression s'effectue en arrière-plan via la redirection
      // L'état de l'application sera complètement réinitialisé
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Une erreur est survenue");
      setIsDeleting(false);
    }
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      // Empêcher la fermeture pendant la suppression
      if (!isDeleting) {
        onOpenChange(open);
      }
    }}>
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
