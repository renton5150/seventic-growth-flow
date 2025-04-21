
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
import { Spinner } from "@/components/ui/spinner";
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
      // Marquer comme suppression en cours
      setIsDeleting(true);
      
      // Fermer la boîte de dialogue immédiatement pour éviter le gel de l'interface
      onOpenChange(false);
      
      // Montrer un toast de chargement
      const toastId = toast.loading(`Suppression de la mission "${missionName}" en cours...`);
      
      // Effectuer la requête de suppression en dehors du cycle de rendu React
      setTimeout(async () => {
        try {
          // Importer dynamiquement le service après la fermeture de l'UI
          const { deleteMission } = await import("@/services/missions-service");
          
          // Effectuer la suppression
          await deleteMission(missionId);
          
          // Notification de succès
          toast.success(`Mission "${missionName}" supprimée avec succès`, { id: toastId });
          
          // Notifier le parent que la suppression est terminée
          setTimeout(() => {
            onDeleted();
            setIsDeleting(false);
          }, 300);
        } catch (error: any) {
          console.error("Erreur lors de la suppression:", error);
          toast.error(`Erreur: ${error.message || "Erreur inconnue"}`, { id: toastId });
          setIsDeleting(false);
        }
      }, 100);
    } catch (error: any) {
      console.error("Erreur générale:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
      setIsDeleting(false);
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
            Êtes-vous sûr de vouloir supprimer la mission "{missionName}" ? Cette action ne peut pas être annulée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" /> Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
