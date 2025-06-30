
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

  // Fonction pour convertir les données initiales avec une gestion sûre des types
  const getInitialValues = (): FormData => {
    if (editMode && initialData) {
      console.log("🔄 Mode édition - données initiales:", initialData);
      
      // Gestion sûre de l'objet targeting avec des valeurs par défaut
      const targeting = initialData.targeting || {};
      
      // Fonction helper pour convertir les valeurs en chaînes
      const arrayOrStringToString = (value: any): string => {
        if (Array.isArray(value)) {
          return value.join(", ");
        }
        if (typeof value === "string") {
          return value;
        }
        return "";
      };

      const formValues: FormData = {
        title: initialData.title || "",
        missionId: initialData.missionId || "",
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString() : "",
        jobTitles: arrayOrStringToString((targeting as any)?.jobTitles),
        industries: arrayOrStringToString((targeting as any)?.industries),
        locations: arrayOrStringToString((targeting as any)?.locations),
        companySize: arrayOrStringToString((targeting as any)?.companySize),
        otherCriteria: (targeting as any)?.otherCriteria || ""
      };

      console.log("✅ Valeurs converties pour le formulaire:", formValues);
      return formValues;
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
    console.log("📥 [DEBUG] Données reçues du formulaire:", data);
    
    if (!user) {
      toast.error("Vous devez être connecté pour créer une requête");
      return;
    }

    setSubmitting(true);

    try {
      // Fonction helper pour convertir les chaînes en tableaux - CORRECTION ICI
      const stringToArray = (str: string | undefined): string[] => {
        console.log("🔧 [DEBUG] Conversion string vers array:", str);
        if (!str || typeof str !== 'string' || str.trim() === '') {
          console.log("⚠️ [DEBUG] Valeur vide ou non-string, retour tableau vide");
          return [];
        }
        const result = str.split(",").map(item => item.trim()).filter(item => item.length > 0);
        console.log("✅ [DEBUG] Résultat de la conversion:", result);
        return result;
      };

      // CORRECTION: Structure correcte des données pour la base de données
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

      console.log("📦 [DEBUG] Données de requête préparées pour la base:", requestData);

      let result;

      if (editMode && initialData) {
        console.log("✏️ Mode édition - mise à jour de la requête:", initialData.id);
        
        // CORRECTION: Données exactes pour la mise à jour
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

        console.log("📝 [DEBUG] Données de mise à jour:", updateData);
        
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
