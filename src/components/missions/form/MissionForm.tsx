
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Mission } from "@/types/types";
import { missionFormSchema, MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { useMissionFormDraft } from "@/hooks/useMissionFormDraft";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCcw, SaveAll } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Import des composants de formulaire
import { FormStepOne } from "./steps/FormStepOne";
import { FormStepTwo } from "./steps/FormStepTwo";
import { FormStepNavigation } from "./components/FormStepNavigation";
import { DraftAlert } from "./components/DraftAlert";

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
    // Correction : Accéder correctement aux champs du schéma Zod
    // Les schémas avec refine() sont de type ZodEffects, nous devons donc accéder au schéma interne
    const totalFields = Object.keys(missionFormSchema._def.schema?._def?.shape || {}).length;
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
    setFormStep(current => Math.min(current + 1, 1));
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

  // Variantes d'animation pour les étapes du formulaire
  const formVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Indicateur de progression */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Étape {formStep + 1} sur 2</span>
            <span>{formProgress}% complété</span>
          </div>
          <Progress value={formProgress} className="h-2" />
        </div>
        
        {/* Message de brouillon */}
        {showDraftMessage && hasDraft && (
          <DraftAlert 
            onRestore={handleRestoreDraft}
            onIgnore={handleIgnoreDraft}
          />
        )}
        
        {/* Étapes du formulaire avec animations */}
        <AnimatePresence mode="wait">
          {formStep === 0 && (
            <motion.div
              key="step1"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={formVariants}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <FormStepOne 
                control={control} 
                isSubmitting={isSubmitting} 
                canEditAllFields={canEditAllFields} 
                mission={mission}
              />
              
              <FormStepNavigation 
                currentStep={0}
                onNext={nextStep}
                canGoNext={!!form.getValues('name') && !!form.getValues('sdrId')}
                isNextDisabled={!!form.formState.errors.name || !!form.formState.errors.sdrId}
              />
            </motion.div>
          )}
          
          {formStep === 1 && (
            <motion.div
              key="step2"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={formVariants}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <FormStepTwo
                control={control}
                isSubmitting={isSubmitting}
                canEditAllFields={canEditAllFields}
                canChangeStatus={canChangeStatus}
                isEditMode={isEditMode}
                mission={mission}
                form={form}
              />
              
              <FormStepNavigation 
                currentStep={1}
                onPrev={prevStep}
                onCancel={onCancel}
                onSubmit={() => {}}
                isSubmitting={isSubmitting}
                isEditMode={isEditMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Form>
  );
};
