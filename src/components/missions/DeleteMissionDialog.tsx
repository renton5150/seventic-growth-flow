
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
import { deleteMission } from "@/services/missions-service"; 
import { checkMissionExists } from "@/services/missions/getMissions"; // Updated import path
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
      
      // 1. Check if mission exists
      const missionExists = await checkMissionExists(missionId);
      console.log("La mission existe-t-elle?", missionExists);
      
      if (!missionExists) {
        toast.error("Échec de la suppression", {
          description: "La mission n'existe pas ou a déjà été supprimée"
        });
        onOpenChange(false);
        return;
      }
      
      // 2. Delete the mission
      const pendingToastId = toast.loading(`Suppression de la mission ${missionName}...`);
      
      const success = await deleteMission(missionId);
      
      // 3. Close dialog
      onOpenChange(false);
      
      // 4. Verify successful deletion
      if (success) {
        // Double-check the mission was truly deleted
        const stillExists = await checkMissionExists(missionId);
        
        if (stillExists) {
          console.error("La mission existe toujours après tentative de suppression");
          toast.error("Échec de la suppression", {
            id: pendingToastId,
            description: "La mission existe toujours après tentative de suppression"
          });
          return;
        }
        
        // Successfully deleted
        toast.success("Mission supprimée", {
          id: pendingToastId,
          description: `La mission ${missionName} a été supprimée avec succès.`
        });
        
        // Refresh the mission list
        onDeleted();
      } else {
        // Delete failed
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
      onOpenChange(false);
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
