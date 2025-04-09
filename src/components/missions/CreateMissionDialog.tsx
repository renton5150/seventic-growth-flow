
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MissionForm } from "./mission-form/MissionForm";
import { MissionFormValues } from "./mission-form/schema";
import { createMission } from "@/services/missionService";

interface CreateMissionDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isAdmin?: boolean;
}

export const CreateMissionDialog = ({
  userId,
  open,
  onOpenChange,
  onSuccess,
  isAdmin = false,
}: CreateMissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: MissionFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Création de mission - données soumises:", values);
      
      const result = await createMission({
        name: values.name,
        description: values.description,
        sdrId: values.sdrId || userId,
        startDate: values.startDate,
      });
      
      if (result) {
        console.log("Mission créée avec succès:", result);
        onSuccess();
        onOpenChange(false);
        toast.success("Mission créée avec succès");
      } else {
        console.error("Échec de création de la mission - résultat undefined");
        toast.error("Erreur lors de la création de la mission");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la mission:", error);
      toast.error("Erreur lors de la création de la mission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle mission</DialogTitle>
          <DialogDescription>
            Veuillez entrer les détails de la nouvelle mission.
          </DialogDescription>
        </DialogHeader>
        
        <MissionForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          defaultValues={{ sdrId: userId }}
          isAdmin={isAdmin}
        />
      </DialogContent>
    </Dialog>
  );
};
