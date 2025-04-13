
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mission } from "@/types/types";
import { MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
import { MissionForm } from "./form/MissionForm";
import { useUpdateMission } from "@/hooks/useMissions";
import { useAuth } from "@/contexts/auth";

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
      
      // Utiliser le hook de mutation pour mettre à jour la mission
      await updateMissionMutation.mutateAsync({
        ...data,
        id: mission.id
      });
      
      onOpenChange(false);
      
      // Appeler le callback approprié
      if (onSuccess) onSuccess();
      if (onMissionUpdated) onMissionUpdated();
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la mission</DialogTitle>
          <DialogDescription>
            Modifiez les détails de la mission {mission?.name}.
          </DialogDescription>
        </DialogHeader>

        <MissionForm
          mission={mission}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
