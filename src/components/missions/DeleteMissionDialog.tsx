
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
import { Button } from "@/components/ui/button";
import { deleteMission, checkMissionExists } from "@/services/missionService";
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

  const handleDelete = async () => {
    if (!missionId) return;
    
    try {
      console.log("Tentative de suppression de la mission:", missionId);
      setIsDeleting(true);
      
      // 1. Fermer la boîte de dialogue d'abord
      onOpenChange(false);
      
      // 2. Montrer un toast de traitement
      const pendingToastId = toast.loading(`Suppression de la mission ${missionName}...`);
      
      // 3. Vérifier si la mission existe avant de la supprimer
      const missionExists = await checkMissionExists(missionId);
      console.log("La mission existe-t-elle?", missionExists);
      
      if (!missionExists) {
        toast.error("Échec de la suppression", {
          id: pendingToastId,
          description: "La mission n'existe pas ou a déjà été supprimée"
        });
        return;
      }
      
      // 4. Supprimer la mission
      const success = await deleteMission(missionId);
      
      // 5. Vérifier le résultat
      if (success) {
        // Vérifier que la mission a bien été supprimée
        const stillExists = await checkMissionExists(missionId);
        
        if (stillExists) {
          console.error("La mission existe toujours après tentative de suppression");
          toast.error("Échec de la suppression", {
            id: pendingToastId,
            description: "La mission existe toujours après tentative de suppression"
          });
          return;
        }
        
        // Suppression réussie
        toast.success("Mission supprimée", {
          id: pendingToastId,
          description: `La mission ${missionName} a été supprimée avec succès.`
        });
        
        // Actualiser la liste des missions
        onDeleted();
      } else {
        // Échec de la suppression
        toast.error("Échec de la suppression", {
          id: pendingToastId,
          description: "Impossible de supprimer la mission. Veuillez réessayer."
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la mission:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la suppression de la mission."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
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
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
