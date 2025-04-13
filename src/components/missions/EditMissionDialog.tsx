
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mission } from "@/types/types";
import { MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
import { MissionForm } from "./form/MissionForm";
import { useUpdateMission } from "@/hooks/useMissions";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditMissionDialogProps {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onMissionUpdated?: () => void;
}

export const EditMissionDialog = ({ 
  mission, 
  open, 
  onOpenChange, 
  onSuccess,
  onMissionUpdated 
}: EditMissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  // Utiliser notre hook personnalisé pour mettre à jour une mission
  const updateMissionMutation = useUpdateMission();

  const handleSubmit = async (data: MissionFormValues) => {
    if (!mission || !mission.id) return;
    
    setIsSubmitting(true);
    try {
      console.log("Données du formulaire avant envoi:", data);
      
      // Ajouter l'ID de la mission aux données
      const missionUpdate = {
        ...data,
        id: mission.id
      };
      
      // Utiliser le hook de mutation pour mettre à jour la mission
      await updateMissionMutation.mutateAsync(missionUpdate);
      
      toast.success("Mission mise à jour avec succès");
      onOpenChange(false);
      
      // Appeler le callback approprié
      if (onSuccess) onSuccess();
      if (onMissionUpdated) onMissionUpdated();
      
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour", {
        description: error.message || "Veuillez réessayer ou contacter l'administrateur"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Afficher un indicateur de chargement pendant que la mutation est en cours
  const isLoading = updateMissionMutation.isPending || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la mission</DialogTitle>
          <DialogDescription>
            Modifiez les détails de la mission {mission?.name}.
          </DialogDescription>
        </DialogHeader>

        {isLoading && updateMissionMutation.isPending ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Mise à jour en cours...</span>
          </div>
        ) : (
          <MissionForm
            mission={mission}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

