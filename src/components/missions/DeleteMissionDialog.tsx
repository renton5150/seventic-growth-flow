
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface DeleteMissionDialogProps {
  mission: Mission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  onSuccess?: () => void;
}

export const DeleteMissionDialog = ({
  mission,
  open,
  onOpenChange,
  onDeleted,
  onSuccess,
}: DeleteMissionDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!mission?.id) {
      toast.error("Impossible de supprimer cette mission : ID invalide");
      onOpenChange(false);
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Appel de l'API de suppression
      const success = await deleteMission(mission.id);
      
      if (success) {
        // Fermer d'abord la boîte de dialogue pour éviter le gel de l'interface
        onOpenChange(false);
        
        // Notifier du succès
        toast.success(`La mission ${mission.name} a été supprimée`);
        
        // Invalider TOUTES les requêtes de mission pour forcer un rechargement complet
        await queryClient.invalidateQueries({ queryKey: ['missions'] });
        
        // Attendre un court instant pour permettre à l'UI de se mettre à jour
        setTimeout(() => {
          // Exécuter les callbacks si fournis
          if (onDeleted) onDeleted();
          if (onSuccess) onSuccess();
        }, 100);
      } else {
        toast.error(`Erreur lors de la suppression de la mission ${mission.name}`);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la mission:", error);
      toast.error("Une erreur est survenue lors de la suppression");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(value) => {
      // Ne permettre la fermeture que si nous ne sommes pas en train de supprimer
      if (!isDeleting) {
        onOpenChange(value);
      }
    }}>
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
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Suppression en cours...
              </>
            ) : "Confirmer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
