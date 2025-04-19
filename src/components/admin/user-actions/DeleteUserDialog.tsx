
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { User } from "@/types/types";
import { deleteUser } from "@/services/user";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

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
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(isOpen);
  
  // Synchroniser l'état interne avec l'état externe
  useEffect(() => {
    setInternalOpen(isOpen);
  }, [isOpen]);
  
  // Nettoyer l'état lors du démontage
  useEffect(() => {
    return () => {
      if (isDeleting) {
        setIsDeleting(false);
      }
    };
  }, [isDeleting, setIsDeleting]);
  
  const handleDeleteUser = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // IMPORTANT: Fermer d'abord la boîte de dialogue
      setInternalOpen(false);
      onOpenChange(false);
      
      // Afficher un toast de chargement
      const toastId = toast.loading(`Suppression de l'utilisateur ${user.name}...`);
      
      // Attendre un court délai pour s'assurer que la boîte de dialogue est fermée
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Effectuer la suppression
      const { success, error, warning } = await deleteUser(user.id);
      
      if (success) {
        toast.dismiss(toastId);
        
        toast.success(warning 
          ? `Utilisateur ${user.name} marqué pour suppression`
          : `Utilisateur ${user.name} supprimé avec succès`
        );
        
        // Rafraichir les données
        queryClient.invalidateQueries({ 
          queryKey: ['admin-users'],
          refetchType: 'all'
        });
        
        // Notifier le composant parent
        onUserDeleted();
      } else {
        toast.dismiss(toastId);
        toast.error(`Erreur: ${error || "Une erreur est survenue"}`);
      }
    } catch (error) {
      console.error("Erreur critique lors de la suppression:", error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <AlertDialog 
      open={internalOpen}
      onOpenChange={(open) => {
        if (!isDeleting) {
          setInternalOpen(open);
          onOpenChange(open);
        }
      }}
    >
      <AlertDialogContent onEscapeKeyDown={(e) => {
        if (isDeleting) {
          e.preventDefault();
        }
      }}>
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
