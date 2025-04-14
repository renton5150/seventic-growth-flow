
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { MissionFormValues } from "@/types/types";
import { missionFormSchema } from "@/components/missions/schemas/missionFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { MissionForm } from "./form/MissionForm";
import { useAllMissions, useCreateMission } from "@/hooks/useMissions";

interface CreateMissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateMissionDialog = ({ open, onOpenChange, onSuccess }: CreateMissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Utiliser nos hooks personnalisés
  const { data: existingMissions = [] } = useAllMissions();
  const createMissionMutation = useCreateMission();
  
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: {
      name: "",
      sdrId: "",
      description: "",
      startDate: null,
      endDate: null,
      type: "Full",
      status: "En cours"
    }
  });

  const validateMissionName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return "Le nom de la mission est obligatoire";
    }
    
    // Vérifier si une mission avec ce nom existe déjà
    const exists = existingMissions.some(mission => 
      mission.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (exists) {
      return "Une mission avec ce nom existe déjà";
    }
    
    return true;
  };

  const onSubmit = async (data: MissionFormValues) => {
    // Valider le nom de la mission
    const nameValidation = validateMissionName(data.name);
    if (nameValidation !== true) {
      form.setError("name", { 
        type: "manual", 
        message: nameValidation 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Utiliser le hook de mutation pour créer la mission
      await createMissionMutation.mutateAsync({
        name: data.name,
        sdrId: data.sdrId === 'unassigned' ? '' : (data.sdrId || ''),
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        status: data.status
      });
      
      form.reset();
      onOpenChange(false);
      onSuccess(); // Refresh missions list
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une mission</DialogTitle>
          <DialogDescription>
            Ajouter une nouvelle mission pour un SDR
          </DialogDescription>
        </DialogHeader>
        
        <MissionForm
          mission={null}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
