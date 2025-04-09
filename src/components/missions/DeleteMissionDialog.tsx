
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
import { toast } from "sonner";

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
      console.log("*** DeleteMissionDialog.handleDelete: Début de la fonction");
      console.log(`Tentative de suppression de la mission ID: ${mission.id}`);
      console.log("Type de l'ID:", typeof mission.id);
      console.log("Longueur de l'ID:", mission.id.length);
      console.log("Données complètes de la mission:", JSON.stringify(mission, null, 2));
      
      const success = await deleteMission(mission.id);
      
      if (success) {
        console.log(`Mission supprimée avec succès: ${mission.id}`);
        toast.success(`La mission ${mission.name} a été supprimée avec succès`);
        
        // Fermer d'abord la boîte de dialogue
        onOpenChange(false);
        
        // Exécuter le callback de succès IMMÉDIATEMENT après la confirmation de suppression
        if (onSuccess) {
          console.log("Exécution du callback onSuccess après suppression");
          onSuccess();
        } else {
          console.warn("Aucun callback onSuccess fourni à DeleteMissionDialog");
        }
      } else {
        console.error(`Échec de la suppression de la mission: ${mission.id}`);
        toast.error(`Erreur lors de la suppression de la mission ${mission.name}`);
      }
      
      console.log("*** DeleteMissionDialog.handleDelete: Fin de la fonction");
    } catch (error) {
      console.error("Erreur lors de la suppression de la mission:", error);
      console.error("Détails de l'erreur:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      toast.error("Une erreur est survenue lors de la suppression de la mission");
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
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <Button 
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting ? "Suppression en cours..." : "Confirmer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
