
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
import { useDeleteMission } from "@/hooks/useMissions"; // Updated to use hook
import { checkMissionExists } from "@/services/missions/getMissions";
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
  const deleteMissionMutation = useDeleteMission();

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
      
      // 2. Delete the mission using the mutation hook
      const pendingToastId = toast.loading(`Suppression de la mission ${missionName}...`);
      
      await deleteMissionMutation.mutateAsync(missionId);
      
      // 3. Close dialog
      onOpenChange(false);
      
      // 4. Show success message
      toast.success("Mission supprimée", {
        id: pendingToastId,
        description: `La mission ${missionName} a été supprimée avec succès.`
      });
      
      // 5. Refresh the mission list
      onDeleted();
      
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
