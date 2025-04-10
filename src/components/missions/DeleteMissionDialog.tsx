
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
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!mission?.id) {
      console.error("Tentative de suppression d'une mission sans ID valide");
      toast.error("Impossible de supprimer cette mission : ID invalide");
      return;
    }
    
    try {
      setIsDeleting(true);
      console.log("Tentative de suppression de la mission ID:", mission.id);
      
      const success = await deleteMission(mission.id);
      
      if (success) {
        console.log(`Mission ${mission.id} supprimée avec succès`);
        
        // Fermer la boîte de dialogue immédiatement
        onOpenChange(false);
        
        // Invalider toutes les requêtes missions pour forcer un rechargement complet
        queryClient.invalidateQueries({queryKey: ['missions']});
        
        // Notification de succès
        toast.success(`La mission ${mission.name} a été supprimée`);
        
        // Exécuter le callback de succès si fourni
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error(`Échec de la suppression de la mission: ${mission.id}`);
        toast.error(`Erreur lors de la suppression de la mission ${mission.name}`);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la mission:", error);
      toast.error("Une erreur est survenue lors de la suppression");
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
