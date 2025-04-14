
import { useAuth } from "@/contexts/auth";
import { Mission } from "@/types/types";
import { MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
import { AnimatePresence } from "framer-motion";
import { Form } from "@/components/ui/form";
import { useMissionForm } from "@/hooks/useMissionForm";

// Import our new components
import { FormProgress } from "./components/FormProgress";
import { DraftAlert } from "./components/DraftAlert";
import { FormStepContainer } from "./components/FormStepContainer";
import { FormStepOne } from "./steps/FormStepOne";
import { FormStepTwo } from "./steps/FormStepTwo";
import { FormStepNavigation } from "./components/FormStepNavigation";

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
  
  // Use our new custom hook
  const {
    form,
    formStep,
    formProgress,
    showDraftMessage,
    hasDraft,
    handleSubmit,
    handleRestoreDraft,
    handleIgnoreDraft,
    nextStep,
    prevStep,
    control
  } = useMissionForm({ mission, isSubmitting, onSubmit, onCancel });
  
  // Determine edit permissions
  const isSDR = user?.role === "sdr";
  const isEditingOwnMission = isSDR && mission?.sdrId === user?.id;
  const canEditAllFields = isAdmin || (!isEditMode && !isSDR);
  const canChangeStatus = isAdmin || isEditingOwnMission;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form progress */}
        <FormProgress 
          currentStep={formStep} 
          progressPercentage={formProgress} 
        />
        
        {/* Draft message */}
        {showDraftMessage && hasDraft && (
          <DraftAlert 
            onRestore={handleRestoreDraft}
            onIgnore={handleIgnoreDraft}
          />
        )}
        
        {/* Form steps with animations */}
        <AnimatePresence mode="wait">
          <FormStepContainer isActive={formStep === 0}>
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
          </FormStepContainer>
          
          <FormStepContainer isActive={formStep === 1}>
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
          </FormStepContainer>
        </AnimatePresence>
      </form>
    </Form>
  );
};
