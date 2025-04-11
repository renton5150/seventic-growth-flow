
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
import { deleteMission } from "@/services/missionService";
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

  const handleDelete = () => {
    if (!missionId) return;
    
    // 1. D'abord fermer la boîte de dialogue
    onOpenChange(false);
    
    // 2. Montrer un toast de traitement
    const pendingToastId = toast.loading(`Suppression de la mission ${missionName}...`);
    
    // 3. Exécuter la suppression avec un léger délai pour éviter les blocages d'interface
    setTimeout(async () => {
      setIsDeleting(true);
      
      try {
        const success = await deleteMission(missionId);
        
        if (success) {
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
          id: pendingToastId,
          description: "Une erreur est survenue lors de la suppression de la mission."
        });
      } finally {
        setIsDeleting(false);
      }
    }, 100);
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
