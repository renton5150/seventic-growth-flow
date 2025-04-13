
import { useEffect, useState } from "react";
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
import { useMissionFormDraft } from "@/hooks/useMissionFormDraft";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCcw, SaveAll } from "lucide-react";

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
  const isEditMode = !!mission?.id;
  
  // Gérer les brouillons automatiques
  const draftId = mission?.id || "new";
  const { formValues, hasDraft, saveDraft, clearDraft, loadDraft } = useMissionFormDraft(
    {
      name: mission?.name || "",
      sdrId: mission?.sdrId || "",
      description: mission?.description || "",
      startDate: mission?.startDate || null,
      endDate: mission?.endDate || null,
      type: mission?.type || "Full",
      status: mission?.status || "En cours",
    },
    { id: draftId, enabled: true }
  );
  
  // Gestion de l'état du formulaire
  const [formStep, setFormStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [showDraftMessage, setShowDraftMessage] = useState(false);
  
  // Initialiser le formulaire avec React Hook Form et Zod pour la validation
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: formValues as any,
    mode: "onChange" // Validation au changement pour feedback immédiat
  });
  
  // Mettre à jour la progression du formulaire
  useEffect(() => {
    const { formState } = form;
    const totalFields = Object.keys(missionFormSchema.shape).length;
    const completedFields = Object.keys(form.getValues()).filter(
      key => !!form.getValues()[key as keyof MissionFormValues]
    ).length;
    
    setFormProgress(Math.round((completedFields / totalFields) * 100));
    
    // Sauvegarder le brouillon lors des changements
    const timeoutId = setTimeout(() => {
      if (!isSubmitting && formState.isDirty) {
        saveDraft(form.getValues());
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [form.watch(), isSubmitting, saveDraft]);
  
  // Afficher le message de brouillon au chargement si un brouillon existe
  useEffect(() => {
    if (hasDraft) {
      setShowDraftMessage(true);
    }
  }, [hasDraft]);
  
  // Charger le brouillon dans le formulaire
  useEffect(() => {
    if (hasDraft) {
      form.reset(formValues as any);
    }
  }, [formValues, hasDraft, form]);
  
  // Gérer la soumission du formulaire
  const handleSubmit = form.handleSubmit((data) => {
    console.log("Données soumises:", data);
    
    // Validation supplémentaire côté client si nécessaire
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return;
    }
    
    // Soumettre le formulaire et supprimer le brouillon en cas de succès
    onSubmit(data);
    clearDraft();
  });
  
  // Déterminer les droits d'édition
  const isSDR = user?.role === "sdr";
  const isEditingOwnMission = isSDR && mission?.sdrId === user?.id;
  const canEditAllFields = isAdmin || (!isEditMode && !isSDR);
  const canChangeStatus = isAdmin || isEditingOwnMission;
  
  // Utiliser "as any" pour le control afin de contourner les problèmes de typage
  const control = form.control as any;

  // Gérer le passage à l'étape suivante
  const nextStep = () => {
    setFormStep(current => Math.min(current + 1, 2));
  };

  // Gérer le retour à l'étape précédente
  const prevStep = () => {
    setFormStep(current => Math.max(current - 1, 0));
  };
  
  // Restaurer un brouillon
  const handleRestoreDraft = () => {
    loadDraft();
    setShowDraftMessage(false);
  };
  
  // Ignorer un brouillon
  const handleIgnoreDraft = () => {
    clearDraft();
    form.reset({
      name: mission?.name || "",
      sdrId: mission?.sdrId || "",
      description: mission?.description || "",
      startDate: mission?.startDate || null,
      endDate: mission?.endDate || null,
      type: mission?.type || "Full",
      status: mission?.status || "En cours",
    } as any);
    setShowDraftMessage(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Indicateur de progression */}
        <Progress value={formProgress} className="mb-6 h-2" />
        
        {/* Message de brouillon */}
        {showDraftMessage && hasDraft && (
          <Alert className="mb-6 animate-fade-in">
            <RefreshCcw className="h-4 w-4" />
            <AlertTitle>Brouillon disponible</AlertTitle>
            <AlertDescription className="flex flex-col space-y-2">
              <p>Un brouillon sauvegardé est disponible pour ce formulaire.</p>
              <div className="flex space-x-2 mt-2">
                <Button size="sm" onClick={handleRestoreDraft}>
                  <SaveAll className="mr-2 h-4 w-4" />
                  Restaurer le brouillon
                </Button>
                <Button size="sm" variant="outline" onClick={handleIgnoreDraft}>
                  Ignorer
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Étapes du formulaire */}
        <div className="space-y-6">
          {formStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-medium">Informations générales</h3>
              <BasicMissionFields
                control={control}
                isSubmitting={isSubmitting}
              />
              
              {canEditAllFields && (
                <SdrSelector control={control} disabled={isSubmitting} />
              )}
              
              {!canEditAllFields && (
                <ReadOnlySdrDisplay 
                  sdrName={mission?.sdrName || "Non assigné"} 
                  sdrId={mission?.sdrId}
                />
              )}
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  disabled={
                    !form.getValues('name') || 
                    !form.getValues('sdrId') ||
                    form.formState.errors.name || 
                    form.formState.errors.sdrId
                  }
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
          
          {formStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-medium">Dates et type</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateField
                  control={control}
                  name="startDate"
                  label="Date de début"
                  disabled={isSubmitting}
                />
                <DateField
                  control={control}
                  name="endDate"
                  label="Date de fin (optionnelle)"
                  disabled={isSubmitting}
                  minDate={form.watch('startDate') || undefined}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MissionTypeSelector
                  control={control}
                  disabled={isSubmitting || !canEditAllFields}
                />
                
                {isEditMode ? (
                  canChangeStatus ? (
                    <StatusSelector 
                      control={control} 
                      disabled={isSubmitting}
                    />
                  ) : (
                    <ReadOnlyStatusDisplay status={mission?.status || "En cours"} />
                  )
                ) : null}
              </div>
              
              <div className="flex justify-between space-x-2">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Retour
                </Button>
                <FormButtons
                  isSubmitting={isSubmitting}
                  onCancel={onCancel}
                  submitLabel={isEditMode ? "Mettre à jour" : "Créer"}
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
};
