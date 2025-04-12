
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { createMission } from "@/services/missions-service"; // Updated import path
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllMissions } from "@/services/missions-service"; // Updated import path
import { MissionFormValues, missionFormSchema } from "./schemas/missionFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { MissionForm } from "./form/MissionForm";

interface CreateMissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateMissionDialog = ({ open, onOpenChange, onSuccess }: CreateMissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch existing missions for duplicate name validation
  const { data: existingMissions = [] } = useQuery({
    queryKey: ['existing-missions'],
    queryFn: () => getAllMissions(),
    enabled: open, // Only fetch when dialog is open
  });
  
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: {
      name: "",
      sdrId: "",
      description: "",
      startDate: null,
      endDate: null,
      type: "Full"
    }
  });

  const validateMissionName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return "Le nom de la mission est obligatoire";
    }
    
    const exists = existingMissions.some(mission => 
      mission.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (exists) {
      return "Une mission avec ce nom existe déjà";
    }
    
    return true;
  };

  const onSubmit = async (data: MissionFormValues) => {
    // Validate mission name for duplicates
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
      // Log pour débogage
      console.log("Données du formulaire:", data);
      
      await createMission({
        name: data.name,
        sdrId: data.sdrId === 'unassigned' ? '' : (data.sdrId || ''),
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type
      });
      
      toast.success('Mission créée avec succès');
      form.reset();
      onOpenChange(false);
      onSuccess(); // Refresh missions list
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error);
      toast.error('Erreur lors de la création de la mission');
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
