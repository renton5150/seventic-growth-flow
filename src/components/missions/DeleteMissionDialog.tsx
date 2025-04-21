
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { deleteMission } from "@/services/missions-service"; 
import { checkMissionExists } from "@/services/missions"; 
import { toast } from "sonner";

interface DeleteMissionDialogProps {
  missionId: string | null;
  missionName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteMissionDialog({
  missionId,
  missionName,
  isOpen,
  onOpenChange,
  onDeleted,
}: DeleteMissionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (event: React.MouseEvent) => {
    event.preventDefault();
    
    if (!missionId || isDeleting) return;
    
    try {
      console.log("Début du processus de suppression pour la mission:", missionId);
      setIsDeleting(true);
      
      // 1. Fermer d'abord la boîte de dialogue pour éviter les problèmes d'interface
      onOpenChange(false);
      
      // 2. Afficher un toast de progression
      const pendingToastId = toast.loading(`Suppression de la mission ${missionName}...`);
      
      // 3. Attendre un court délai pour que le dialogue soit complètement fermé
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 4. Vérifier que la mission existe avant de tenter de la supprimer
      const missionExists = await checkMissionExists(missionId);
      if (!missionExists) {
        toast.error("La mission n'existe pas ou a déjà été supprimée", {
          id: pendingToastId
        });
        return;
      }
      
      // 5. Effectuer la suppression
      const success = await deleteMission(missionId);
      
      // 6. Gérer le résultat
      if (success) {
        // Notification de succès
        toast.success("Mission supprimée avec succès", {
          id: pendingToastId,
          description: `La mission ${missionName} a été supprimée.`
        });
        
        // Attendre un court délai pour que les autres composants puissent terminer leurs transitions
        setTimeout(() => {
          // Informer le parent que la mission a été supprimée
          onDeleted();
        }, 300);
      } else {
        toast.error("Échec de la suppression", {
          id: pendingToastId,
          description: "Impossible de supprimer la mission. Veuillez réessayer."
        });
      }
    } catch (error) {
      console.error("Erreur critique lors de la suppression de la mission:", error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      // Réinitialiser l'état de suppression après un délai
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
            Êtes-vous sûr de vouloir supprimer la mission "{missionName}" ?
            Cette action ne peut pas être annulée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
