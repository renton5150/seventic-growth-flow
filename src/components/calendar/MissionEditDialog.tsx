
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MissionForm } from "@/components/missions/form/MissionForm";
import { Mission } from "@/types/types";
import { MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
import { createMission, updateMission } from "@/services/missions-service";
import { toast } from "sonner";

interface MissionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mission?: Mission | null;
  selectedDate?: Date | null;
  onSave: () => void;
}

export const MissionEditDialog: React.FC<MissionEditDialogProps> = ({
  isOpen,
  onClose,
  mission,
  selectedDate,
  onSave
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!mission;

  const handleSubmit = async (values: MissionFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing && mission) {
        // Mise à jour d'une mission existante
        const updatedMission = {
          id: mission.id,
          name: values.name,
          sdrId: values.sdrId,
          description: values.description || "",
          startDate: values.startDate,
          endDate: values.endDate,
          type: values.type,
          status: values.status
        };
        
        await updateMission(updatedMission);
        toast.success(`Mission "${values.name}" mise à jour avec succès`);
      } else {
        // Création d'une nouvelle mission
        const newMission = {
          name: values.name,
          sdrId: values.sdrId,
          description: values.description || "",
          startDate: values.startDate || selectedDate,
          endDate: values.endDate,
          type: values.type,
          status: values.status || "En cours"
        };
        
        await createMission(newMission);
        toast.success(`Mission "${values.name}" créée avec succès`);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde de la mission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Modifier "${mission?.name}"` : "Nouvelle mission"}
          </DialogTitle>
        </DialogHeader>
        
        <MissionForm
          mission={mission}
          defaultStartDate={selectedDate}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
