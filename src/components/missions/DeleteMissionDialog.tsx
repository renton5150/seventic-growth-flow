
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
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

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
    if (!missionId || isDeleting) return;

    try {
      // Indiquer que la suppression est en cours
      setIsDeleting(true);
      
      // Créer un toast de chargement
      const toastId = toast.loading(`Suppression de la mission "${missionName}" en cours...`);
      
      // Fermer immédiatement la boîte de dialogue pour éviter le gel de l'interface
      onOpenChange(false);
      
      // Importer dynamiquement le service pour éviter des problèmes de chargement
      const { deleteSupabaseMission } = await import("@/services/missions-service");
      
      // Effectuer la suppression avec un délai minimal pour permettre à l'UI de se mettre à jour
      setTimeout(async () => {
        try {
          const success = await deleteSupabaseMission(missionId);
          
          if (success) {
            toast.success(`Mission "${missionName}" supprimée avec succès`, { id: toastId });
            // Notifier le parent que la suppression est terminée
            onDeleted();
          } else {
            toast.error("Échec de la suppression. Veuillez réessayer.", { id: toastId });
          }
        } catch (error: any) {
          console.error("Erreur lors de la suppression:", error);
          toast.error(`Erreur: ${error.message || "Erreur inconnue"}`, { id: toastId });
        } finally {
          // S'assurer que l'état isDeleting est réinitialisé
          setIsDeleting(false);
        }
      }, 100);
      
    } catch (error: any) {
      console.error("Erreur générale lors de la suppression:", error);
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
