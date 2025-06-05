
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

  const getInitialValues = () => {
    if (editMode && initialData) {
      const targeting = initialData.targeting || {
        jobTitles: [],
        industries: [],
        locations: [],
        companySize: [],
        otherCriteria: ""
      };

      // Convert string date to string format for input (YYYY-MM-DD)
      const dueDate = initialData.dueDate ? initialData.dueDate.split('T')[0] : "";

      return {
        title: initialData.title || "",
        missionId: initialData.missionId || "",
        dueDate: dueDate,
        jobTitles: targeting.jobTitles.join(", ") || "",
        industries: targeting.industries.join(", ") || "",
        locations: targeting.locations?.join(", ") || "",
        companySize: targeting.companySize.join(", ") || "",
        otherCriteria: targeting.otherCriteria || ""
      };
    }
    return defaultValues;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues()
  });

  useEffect(() => {
    // Mettre à jour les valeurs du formulaire lorsque initialData change
    if (editMode && initialData) {
      form.reset(getInitialValues());
    }
  }, [initialData, editMode, form]);

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error("Vous devez être connecté pour créer une requête");
      return;
    }

    setSubmitting(true);

    try {
      const requestData = {
        title: data.title,
        missionId: data.missionId,
        createdBy: user.id,
        dueDate: data.dueDate, // Keep as string
        targeting: {
          jobTitles: data.jobTitles ? data.jobTitles.split(",").map(item => item.trim()) : [],
          industries: data.industries ? data.industries.split(",").map(item => item.trim()) : [],
          locations: data.locations ? data.locations.split(",").map(item => item.trim()) : [],
          companySize: data.companySize ? data.companySize.split(",").map(item => item.trim()) : [],
          otherCriteria: data.otherCriteria || ""
        }
      };

      let result;

      if (editMode && initialData) {
        result = await updateRequest(initialData.id, {
          title: data.title,
          dueDate: data.dueDate, // Keep as string
          targeting: requestData.targeting
        } as Partial<LinkedInScrapingRequest>);

        if (result) {
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
        const newRequest = await createLinkedInScrapingRequest(requestData);

        if (newRequest) {
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
      console.error("Erreur lors de la soumission:", error);
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
