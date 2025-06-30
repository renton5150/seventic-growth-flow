
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

  // Fonction pour convertir les données initiales
  const getInitialValues = (): FormData => {
    if (editMode && initialData) {
      console.log("🔄 Mode édition - données initiales:", initialData);
      
      const targeting = initialData.targeting || {};

      return {
        title: initialData.title || "",
        missionId: initialData.missionId || "",
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString() : "",
        jobTitles: Array.isArray(targeting.jobTitles) 
          ? targeting.jobTitles.join(", ") 
          : targeting.jobTitles || "",
        industries: Array.isArray(targeting.industries) 
          ? targeting.industries.join(", ") 
          : targeting.industries || "",
        locations: Array.isArray(targeting.locations) 
          ? targeting.locations.join(", ") 
          : targeting.locations || "",
        companySize: Array.isArray(targeting.companySize) 
          ? targeting.companySize.join(", ") 
          : targeting.companySize || "",
        otherCriteria: targeting.otherCriteria || ""
      };
    }
    
    console.log("📝 Mode création - valeurs par défaut");
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
    console.log("👀 Valeurs surveillées:", watchedValues);
  }, [watchedValues]);

  // Réinitialiser le formulaire quand les données initiales changent
  useEffect(() => {
    if (editMode && initialData) {
      const newValues = getInitialValues();
      console.log("🔄 Réinitialisation avec:", newValues);
      form.reset(newValues);
    }
  }, [initialData, editMode]);

  const onSubmit = async (data: FormData) => {
    console.log("🚀 === SOUMISSION DU FORMULAIRE ===");
    console.log("📥 Données reçues:", data);
    
    if (!user) {
      toast.error("Vous devez être connecté pour créer une requête");
      return;
    }

    setSubmitting(true);

    try {
      // Fonction helper pour convertir les chaînes en tableaux
      const stringToArray = (str: string): string[] => {
        if (!str || typeof str !== 'string') return [];
        return str.split(",").map(item => item.trim()).filter(item => item.length > 0);
      };

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

      console.log("📦 Données de requête préparées:", requestData);

      let result;

      if (editMode && initialData) {
        console.log("✏️ Mode édition - mise à jour de la requête:", initialData.id);
        result = await updateRequest(initialData.id, {
          title: data.title,
          dueDate: data.dueDate,
          targeting: requestData.targeting
        } as Partial<LinkedInScrapingRequest>);

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
