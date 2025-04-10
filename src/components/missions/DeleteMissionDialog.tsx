
import { useState } from "react";
import { Mission } from "@/types/types";
import { deleteMission } from "@/services/missionService";
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

interface DeleteMissionDialogProps {
  mission: Mission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const DeleteMissionDialog = ({
  mission,
  open,
  onOpenChange,
  onSuccess,
}: DeleteMissionDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      console.log("Suppression de la mission:", mission.id);
      
      await deleteMission(mission.id);
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la suppression de la mission:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette mission ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Toutes les données associées à la mission "{mission.name}" seront définitivement supprimées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Suppression en cours..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
