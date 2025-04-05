
import { useState } from "react";
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
import { createLinkedInScrapingRequest } from "@/services/requestService";

export const LinkedInScrapingForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    
    try {
      console.log("Données soumises:", data);
      
      // Créer une nouvelle demande LinkedIn dans le mock data
      const newRequest = createLinkedInScrapingRequest({
        title: data.title,
        missionId: data.missionId,
        createdBy: user?.id,
        targeting: data.targeting,
        dueDate: data.dueDate
      });
      
      console.log("Nouvelle demande créée:", newRequest);
      
      toast.success("Demande de scrapping LinkedIn créée avec succès");
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error("Erreur lors de la création de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormHeader control={form.control} user={user} />
        <TargetingSection control={form.control} />
        <FormFooter submitting={submitting} />
      </form>
    </Form>
  );
};
