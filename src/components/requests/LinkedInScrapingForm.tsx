
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { FormHeader } from "./linkedin-scraping/FormHeader";
import { TargetingSection } from "./linkedin-scraping/TargetingSection";
import { FormFooter } from "./linkedin-scraping/FormFooter";
import { formSchema, FormData, defaultValues } from "./linkedin-scraping/schema";
import { createLinkedInScrapingRequest, updateRequest } from "@/services/requestService";
import { LinkedInScrapingRequest } from "@/types/types";

interface LinkedInScrapingFormProps {
  editMode?: boolean;
  initialData?: LinkedInScrapingRequest;
  onSuccess?: () => void;
}

export const LinkedInScrapingForm = ({ editMode = false, initialData, onSuccess }: LinkedInScrapingFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // CORRECTION CRITIQUE: Fonction helper pour convertir array -> string de façon sûre
  const arrayToString = (value: any): string => {
    console.log("🔧 [arrayToString] Input:", value, "Type:", typeof value);
    
    if (Array.isArray(value)) {
      const result = value.join(", ");
      console.log("✅ [arrayToString] Array converted:", result);
      return result;
    }
    
    if (typeof value === "string") {
      console.log("✅ [arrayToString] Already string:", value);
      return value;
    }
    
    console.log("⚠️ [arrayToString] Fallback to empty string for:", value);
    return "";
  };

  // CORRECTION MAJEURE: Fonction pour obtenir les valeurs initiales avec accès correct aux données
  const getInitialValues = (): FormData => {
    if (editMode && initialData) {
      console.log("🔄 [getInitialValues] Mode édition - données initiales:", initialData);
      
      // CORRECTION CRITIQUE: Accéder aux données de ciblage dans initialData.details.targeting
      const targeting = initialData.details?.targeting || {};
      console.log("🎯 [getInitialValues] Targeting data from details:", targeting);

      const formValues: FormData = {
        title: initialData.title || "",
        missionId: initialData.missionId || "",
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString() : "",
        // CORRECTION CRITIQUE: Conversion correcte des arrays en strings depuis details.targeting
        jobTitles: arrayToString(targeting.jobTitles),
        industries: arrayToString(targeting.industries),
        locations: arrayToString(targeting.locations),
        companySize: arrayToString(targeting.companySize),
        otherCriteria: targeting.otherCriteria || ""
      };

      console.log("✅ [getInitialValues] Valeurs converties pour le formulaire:", formValues);
      return formValues;
    }
    
    console.log("📝 [getInitialValues] Mode création - valeurs par défaut");
    return defaultValues;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
    mode: "onChange"
  });

  // Observer les changements de valeurs pour debug
  const watchedValues = form.watch();
  useEffect(() => {
    console.log("👀 [DEBUG] Valeurs surveillées du formulaire:", watchedValues);
  }, [watchedValues]);

  // Réinitialiser le formulaire quand les données initiales changent
  useEffect(() => {
    if (editMode && initialData) {
      const newValues = getInitialValues();
      console.log("🔄 Réinitialisation du formulaire avec:", newValues);
      form.reset(newValues);
    }
  }, [initialData, editMode]);

  const onSubmit = async (data: FormData) => {
    console.log("🚀 === SOUMISSION DU FORMULAIRE ===");
    console.log("📥 [DEBUG] FORM VALUES BEFORE SUBMISSION:", JSON.stringify(data, null, 2));
    
    if (!user) {
      toast.error("Vous devez être connecté pour créer une requête");
      return;
    }

    setSubmitting(true);

    try {
      // CORRECTION CRITIQUE: Fonction de conversion string -> array repositionnée et corrigée
      const stringToArray = (str: string | undefined): string[] => {
        console.log("🔧 [stringToArray] Converting:", str, "Type:", typeof str);
        
        if (!str || typeof str !== 'string' || str.trim() === '') {
          console.log("⚠️ [stringToArray] Empty or invalid input, returning empty array");
          return [];
        }
        
        const result = str.split(",")
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        console.log("✅ [stringToArray] Conversion result:", result);
        return result;
      };

      // CORRECTION: Structure des données exactement comme dans EmailCampaignForm
      const requestData = {
        title: data.title,
        missionId: data.missionId,
        createdBy: user.id,
        dueDate: data.dueDate,
        targeting: {
          jobTitles: stringToArray(data.jobTitles),
          industries: stringToArray(data.industries), 
          locations: stringToArray(data.locations),
          companySize: stringToArray(data.companySize),
          otherCriteria: data.otherCriteria || ""
        }
      };

      console.log("📦 [DEBUG] PROCESSED DATA FOR API:", JSON.stringify(requestData, null, 2));

      let result;

      if (editMode && initialData) {
        console.log("✏️ Mode édition - mise à jour de la requête:", initialData.id);
        
        const updateData = {
          title: data.title,
          dueDate: data.dueDate,
          targeting: {
            jobTitles: stringToArray(data.jobTitles),
            industries: stringToArray(data.industries),
            locations: stringToArray(data.locations),
            companySize: stringToArray(data.companySize),
            otherCriteria: data.otherCriteria || ""
          }
        };

        console.log("📝 [DEBUG] Update data being sent:", JSON.stringify(updateData, null, 2));
        
        result = await updateRequest(initialData.id, updateData as Partial<LinkedInScrapingRequest>);

        if (result) {
          console.log("✅ Requête mise à jour avec succès");
          toast.success("Demande de scraping LinkedIn mise à jour avec succès");
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/requests/linkedin/" + initialData.id);
          }
        } else {
          throw new Error("Erreur lors de la mise à jour de la demande");
        }
      } else {
        console.log("➕ Mode création - nouvelle requête");
        const newRequest = await createLinkedInScrapingRequest(requestData);

        if (newRequest) {
          console.log("✅ Nouvelle requête créée avec succès:", newRequest);
          toast.success("Demande de scraping LinkedIn créée avec succès");
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/dashboard");
          }
        } else {
          throw new Error("Erreur lors de la création de la demande");
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la soumission:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Erreur inconnue lors de la création/modification de la demande";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormHeader control={form.control} user={user} editMode={editMode} />
        <TargetingSection control={form.control} />
        <FormFooter submitting={submitting} editMode={editMode} />
      </form>
    </Form>
  );
};
