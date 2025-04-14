
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mission } from "@/types/types";
import { missionFormSchema, MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
import { useMissionFormDraft } from "@/hooks/useMissionFormDraft";

interface UseMissionFormProps {
  mission: Mission | null;
  isSubmitting: boolean;
  onSubmit: (data: MissionFormValues) => void;
  onCancel: () => void;
}

export const useMissionForm = ({
  mission,
  isSubmitting,
  onSubmit,
  onCancel
}: UseMissionFormProps) => {
  // Manage form steps
  const [formStep, setFormStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [showDraftMessage, setShowDraftMessage] = useState(false);
  
  // Setup draft functionality
  const draftId = mission?.id || "new";
  const { 
    formValues, 
    hasDraft, 
    saveDraft, 
    clearDraft, 
    loadDraft 
  } = useMissionFormDraft(
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
  
  // Initialize form
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: formValues as any,
    mode: "onChange"
  });
  
  // Update form progress
  useEffect(() => {
    const { formState } = form;
    const totalFields = Object.keys(missionFormSchema._def.schema?._def?.shape || {}).length;
    const completedFields = Object.keys(form.getValues()).filter(
      key => !!form.getValues()[key as keyof MissionFormValues]
    ).length;
    
    setFormProgress(Math.round((completedFields / totalFields) * 100));
    
    // Save draft on changes
    const timeoutId = setTimeout(() => {
      if (!isSubmitting && formState.isDirty) {
        saveDraft(form.getValues());
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [form.watch(), isSubmitting, saveDraft]);
  
  // Show draft message on load if draft exists
  useEffect(() => {
    if (hasDraft) {
      setShowDraftMessage(true);
    }
  }, [hasDraft]);
  
  // Load draft into form
  useEffect(() => {
    if (hasDraft) {
      form.reset(formValues as any);
    }
  }, [formValues, hasDraft, form]);
  
  // Form navigation
  const nextStep = () => setFormStep(current => Math.min(current + 1, 1));
  const prevStep = () => setFormStep(current => Math.max(current - 1, 0));
  
  // Draft management
  const handleRestoreDraft = () => {
    loadDraft();
    setShowDraftMessage(false);
  };
  
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
  
  // Form submission
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
    clearDraft();
  });
  
  return {
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
    onCancel,
    control: form.control as any
  };
};
