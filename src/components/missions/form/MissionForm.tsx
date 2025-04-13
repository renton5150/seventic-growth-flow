
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Mission } from "@/types/types";
import { MissionFormValues, missionFormSchema } from "@/components/missions/schemas/missionFormSchema";
import { DateField } from "../form-fields/DateField";
import { SdrSelector } from "../form-fields/SdrSelector";
import { MissionTypeSelector } from "../form-fields/MissionTypeSelector";
import { useAuth } from "@/contexts/AuthContext";
import { BasicMissionFields } from "./components/BasicMissionFields";
import { StatusSelector } from "./components/StatusSelector";
import { ReadOnlyStatusDisplay } from "./components/ReadOnlyStatusDisplay";
import { ReadOnlySdrDisplay } from "./components/ReadOnlySdrDisplay";
import { FormButtons } from "./components/FormButtons";

interface MissionFormProps {
  mission: Mission | null;
  isSubmitting: boolean;
  onSubmit: (values: MissionFormValues) => void;
  onCancel: () => void;
}

export function MissionForm({ mission, isSubmitting, onSubmit, onCancel }: MissionFormProps) {
  const [formInitialized, setFormInitialized] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: {
      name: "",
      sdrId: "",
      description: "",
      startDate: null,
      endDate: null,
      type: "Full",
      status: "En cours",
    },
  });

  useEffect(() => {
    if (mission) {
      console.log("Initialisation du formulaire d'édition avec les valeurs de mission:", mission);
      console.log("Statut de la mission à initialiser:", mission.status);
      try {
        form.reset({
          name: mission.name,
          sdrId: mission.sdrId || "",
          description: mission.description || "",
          startDate: mission.startDate ? new Date(mission.startDate) : null,
          endDate: mission.endDate ? new Date(mission.endDate) : null,
          type: mission.type,
          status: mission.status,
        });
        setFormInitialized(true);
      } catch (error) {
        console.error("Erreur lors de l'initialisation du formulaire:", error);
      }
    }
  }, [mission, form]);

  const startDate = form.watch("startDate");
  
  // Logging pour le débogage du statut
  const selectedStatus = form.watch("status");
  useEffect(() => {
    console.log("Statut actuellement sélectionné dans le formulaire:", selectedStatus);
  }, [selectedStatus]);

  if (!formInitialized && mission) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Chargement du formulaire...</span>
      </div>
    );
  }

  const handleFormSubmit = (values: MissionFormValues) => {
    console.log("Formulaire soumis avec les valeurs:", values);
    console.log("Statut lors de la soumission:", values.status);
    onSubmit(values);
  };

  // Restricted view for non-admin users editing an existing mission
  if (!isAdmin && mission) {
    return renderRestrictedForm(mission);
  }

  // Full edit form for admins or new mission creation
  return renderFullForm();

  function renderRestrictedForm(mission: Mission) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <BasicMissionFields control={form.control} isSubmitting={isSubmitting} />
          
          <ReadOnlySdrDisplay sdrName={mission.sdrName} />
          <input type="hidden" {...form.register("sdrId")} />
          
          <DateField 
            control={form.control}
            name="startDate"
            label="Date de démarrage"
            disabled={isSubmitting}
          />

          <DateField 
            control={form.control}
            name="endDate"
            label="Date de fin"
            disabled={isSubmitting}
            minDate={startDate}
          />

          <ReadOnlyStatusDisplay status={mission.status} />
          <input type="hidden" {...form.register("status")} />

          <FormButtons 
            isSubmitting={isSubmitting} 
            onCancel={onCancel}
          />
        </form>
      </Form>
    );
  }

  function renderFullForm() {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <BasicMissionFields control={form.control} isSubmitting={isSubmitting} />
          
          <SdrSelector 
            control={form.control} 
            disabled={isSubmitting} 
            initialSdrName={mission?.sdrName}
          />

          <DateField 
            control={form.control}
            name="startDate"
            label="Date de démarrage"
            disabled={isSubmitting}
          />

          <DateField 
            control={form.control}
            name="endDate"
            label="Date de fin"
            disabled={isSubmitting}
            minDate={startDate}
          />

          <StatusSelector control={form.control} disabled={isSubmitting} />

          <FormButtons 
            isSubmitting={isSubmitting} 
            onCancel={onCancel}
          />
        </form>
      </Form>
    );
  }
}
