
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
      // Set state first to prevent multiple deletions
      setIsDeleting(true);
      
      // Close the dialog immediately
      onOpenChange(false);
      
      // Show loading toast
      const toastId = toast.loading(`Suppression de la mission "${missionName}" en cours...`);
      
      // Import services dynamically to avoid circular dependencies
      const { deleteMission } = await import("@/services/missions-service");
      const { checkMissionExists } = await import("@/services/missions");
      
      // Small delay to ensure UI updates properly
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify mission exists
      const missionExists = await checkMissionExists(missionId);
      if (!missionExists) {
        toast.error("La mission n'existe pas ou a déjà été supprimée", {
          id: toastId
        });
        setIsDeleting(false);
        return;
      }
      
      // Delete the mission
      const success = await deleteMission(missionId);
      
      if (success) {
        toast.success(`Mission "${missionName}" supprimée avec succès`, {
          id: toastId
        });
        
        // Notify parent component after a short delay
        setTimeout(() => {
          onDeleted();
          setIsDeleting(false);
        }, 300);
      } else {
        toast.error("Échec de la suppression", {
          id: toastId,
          description: "Impossible de supprimer la mission. Veuillez réessayer."
        });
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Une erreur est survenue lors de la suppression");
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
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
