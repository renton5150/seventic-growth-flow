
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Mission } from "@/types/types";
import { missionFormSchema, MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
import { DateField } from "../form-fields/DateField";
import { SdrSelector } from "../form-fields/SdrSelector";
import { MissionTypeSelector } from "../form-fields/MissionTypeSelector";
import { StatusSelector } from "./components/StatusSelector";
import { FormButtons } from "./components/FormButtons";
import { BasicMissionFields } from "./components/BasicMissionFields";
import { ReadOnlySdrDisplay } from "./components/ReadOnlySdrDisplay";
import { ReadOnlyStatusDisplay } from "./components/ReadOnlyStatusDisplay";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

interface MissionFormProps {
  mission: Mission | null;
  isSubmitting: boolean;
  onSubmit: (data: MissionFormValues) => void;
  onCancel: () => void;
}

export const MissionForm = ({
  mission,
  isSubmitting,
  onSubmit,
  onCancel,
}: MissionFormProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  // Initialiser le formulaire avec React Hook Form et Zod pour la validation
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: {
      name: mission?.name || "",
      sdrId: mission?.sdrId || "",
      description: mission?.description || "",
      startDate: mission?.startDate || null,
      endDate: mission?.endDate || null,
      type: mission?.type || "Full",
      status: mission?.status || "En cours",
    },
  });
  
  // Mettre à jour les valeurs du formulaire lorsque la mission change
  useEffect(() => {
    if (mission) {
      console.log("Mission chargée dans le formulaire:", mission);
      
      form.reset({
        id: mission.id,
        name: mission.name,
        sdrId: mission.sdrId,
        description: mission.description || "",
        startDate: mission.startDate,
        endDate: mission.endDate,
        type: mission.type,
        status: mission.status,
      });
    }
  }, [mission, form]);

  // Gérer la soumission du formulaire
  const handleSubmit = form.handleSubmit((data) => {
    console.log("Données soumises:", data);
    
    // Validation supplémentaire côté client si nécessaire
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return;
    }
    
    onSubmit(data);
  });

  // Déterminer si c'est une création ou une édition
  const isEditMode = !!mission?.id;
  
  // Déterminer les droits d'édition
  const isSDR = user?.role === "sdr";
  const isEditingOwnMission = isSDR && mission?.sdrId === user?.id;
  const canEditAllFields = isAdmin || (!isEditMode && !isSDR);
  const canChangeStatus = isAdmin || isEditingOwnMission;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicMissionFields
          control={form.control}
          isSubmitting={isSubmitting}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField
            control={form.control}
            name="startDate"
            label="Date de début"
            disabled={isSubmitting}
          />
          <DateField
            control={form.control}
            name="endDate"
            label="Date de fin (optionnelle)"
            disabled={isSubmitting}
            minDate={form.watch('startDate') || null}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MissionTypeSelector
            control={form.control}
            disabled={isSubmitting || !canEditAllFields}
          />
          
          {isEditMode ? (
            canChangeStatus ? (
              <StatusSelector 
                control={form.control} 
                disabled={isSubmitting}
              />
            ) : (
              <ReadOnlyStatusDisplay status={mission?.status || "En cours"} />
            )
          ) : null}
        </div>

        {canEditAllFields ? (
          <SdrSelector control={form.control} disabled={isSubmitting} />
        ) : (
          <ReadOnlySdrDisplay 
            sdrName={mission?.sdrName || "Non assigné"} 
            sdrId={mission?.sdrId}
          />
        )}

        <FormButtons
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          submitLabel={isEditMode ? "Mettre à jour" : "Créer"}
        />
      </form>
    </Form>
  );
};

