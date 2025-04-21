
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
      
      // Show loading toast BEFORE closing dialog to ensure visual feedback
      const toastId = toast.loading(`Suppression de la mission "${missionName}" en cours...`);
      
      // Close the dialog immediately after toast is displayed
      onOpenChange(false);
      
      // Import services dynamically to avoid circular dependencies
      const { deleteSupabaseMission } = await import("@/services/missions-service");
      
      // Add a small delay to ensure UI updates properly
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        // Delete the mission
        const success = await deleteSupabaseMission(missionId);
        
        if (success) {
          toast.success(`Mission "${missionName}" supprimée avec succès`, {
            id: toastId
          });
          
          // Notify parent component after a short delay
          setTimeout(() => {
            onDeleted();
          }, 500);
        } else {
          toast.error("Échec de la suppression", {
            id: toastId,
            description: "Impossible de supprimer la mission. Veuillez réessayer."
          });
        }
      } catch (error: any) {
        console.error("Erreur lors de la suppression:", error);
        toast.error(`Erreur: ${error.message || "Erreur inconnue"}`, {
          id: toastId
        });
      } finally {
        // Always reset the deleting state
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Erreur globale:", error);
      setIsDeleting(false);
      toast.error("Une erreur inattendue est survenue");
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
            onClick={(e) => {
              // Prevent default to handle deletion manually
              e.preventDefault(); 
              handleDelete();
            }}
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
