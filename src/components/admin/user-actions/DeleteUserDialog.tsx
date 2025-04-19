
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
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Synchroniser l'état interne avec l'état externe
  useEffect(() => {
    setInternalOpen(isOpen);
  }, [isOpen]);
  
  // Nettoyer l'état lors du démontage pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      // Nettoyage de l'état lors du démontage du composant
      if (isDeleting) {
        console.log("Composant démonté pendant la suppression, nettoyage de l'état");
        setTimeout(() => setIsDeleting(false), 100);
      }
    };
  }, [isDeleting, setIsDeleting]);
  
  const handleDeleteUser = async () => {
    if (isDeleting) return; // Éviter les doubles clics
    
    // Afficher un toast de chargement persistant avec ID
    const toastId = toast.loading(`Suppression de l'utilisateur ${user.name}...`);
    
    try {
      setIsDeleting(true);
      
      // IMPORTANT: Fermer d'abord la boîte de dialogue pour éviter le gel de l'interface
      setInternalOpen(false);
      onOpenChange(false);
      
      // Délai minimum pour s'assurer que la boîte de dialogue est fermée avant de continuer
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Effectuer la suppression après la fermeture de la boîte de dialogue
      console.log(`Tentative de suppression de l'utilisateur: ${user.id}`);
      const { success, error, warning } = await deleteUser(user.id);
      
      if (success) {
        // Supprimer le toast de chargement et afficher un succès
        toast.dismiss(toastId);
        
        if (warning) {
          toast.success(`Utilisateur ${user.name} marqué pour suppression`, {
            description: warning,
            duration: 5000
          });
        } else {
          toast.success(`Utilisateur ${user.name} supprimé avec succès`);
        }
        
        // Garantir que toutes les requêtes utilisateurs sont invalidées avec un délai
        setTimeout(() => {
          queryClient.invalidateQueries({ 
            queryKey: ['users'],
            refetchType: 'all'
          });
          queryClient.invalidateQueries({ 
            queryKey: ['admin-users'],
            refetchType: 'all'
          });
          
          // Utiliser un délai plus long pour s'assurer que les états sont mis à jour
          setTimeout(() => {
            onUserDeleted();
            setIsDeleting(false);
          }, 300);
        }, 300);
      } else {
        toast.dismiss(toastId);
        toast.error(`Erreur: ${error || "Une erreur est survenue lors de la suppression"}`);
        setIsDeleting(false);
      }
    } catch (error) {
      // En cas d'erreur, s'assurer que l'interface reste utilisable
      console.error("Erreur critique lors de la suppression:", error);
      toast.dismiss(toastId);
      toast.error("Une erreur inattendue est survenue");
      setIsDeleting(false);
    }
  };
  
  return (
    <AlertDialog 
      open={internalOpen} 
      onOpenChange={(open) => {
        // Empêcher la fermeture pendant la suppression
        if (!isDeleting) {
          setInternalOpen(open);
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
