
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
import { supabase } from "@/integrations/supabase/client";

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
      
      // Fermer la boîte de dialogue immédiatement
      onOpenChange(false);
      
      // Afficher un toast de chargement
      const toastId = toast.loading(`Suppression de la mission "${missionName}" en cours...`);
      
      // Attendre un court instant pour que l'UI se mette à jour
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Supprimer directement via Supabase en une seule opération
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', missionId);
      
      if (error) {
        console.error("Erreur Supabase lors de la suppression:", error);
        toast.error(`Erreur: ${error.message || "Erreur inconnue"}`, { id: toastId });
        setIsDeleting(false);
        return;
      }
      
      // Notification de succès
      toast.success(`Mission "${missionName}" supprimée avec succès`, { id: toastId });
      
      // Forcer le rechargement de la page après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error(`Erreur inattendue lors de la suppression. Veuillez réessayer.`);
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
