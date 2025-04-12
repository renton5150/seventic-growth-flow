
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mission } from "@/types/types";
import { updateMission } from "@/services/missions-service"; // Updated import path
import { MissionForm } from "./form/MissionForm";
import { MissionFormValues } from "./schemas/missionFormSchema";

interface EditMissionDialogProps {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMissionUpdated?: () => void;
}

export function EditMissionDialog({
  mission,
  open,
  onOpenChange,
  onMissionUpdated,
}: EditMissionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fonction de soumission du formulaire
  const onSubmit = async (values: MissionFormValues) => {
    if (!mission) return;
    
    try {
      console.log("Formulaire de mise à jour soumis avec les valeurs:", values);
      console.log("SDR ID sélectionné pour mise à jour:", values.sdrId);
      
      setIsSubmitting(true);
      
      const updatedMissionData = {
        id: mission.id,
        name: values.name,
        client: values.client || "",
        sdrId: values.sdrId,
        description: values.description || "",
        startDate: values.startDate,
        endDate: values.endDate,
        type: values.type,
      };
      
      console.log("Données préparées pour la mise à jour:", updatedMissionData);
      
      // Appel API pour mettre à jour
      await updateMission(updatedMissionData);
      
      onOpenChange(false);
      
      toast.success("Mission mise à jour", {
        description: "La mission a été mise à jour avec succès"
      });
      
      if (onMissionUpdated) {
        onMissionUpdated();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour", {
        description: "Une erreur est survenue lors de la mise à jour de la mission"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier la mission</DialogTitle>
        </DialogHeader>
        
        <MissionForm
          mission={mission}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
