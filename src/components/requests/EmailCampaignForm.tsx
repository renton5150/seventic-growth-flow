
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { FormHeader } from "./email-campaign/FormHeader";
import { TemplateSection } from "./email-campaign/TemplateSection";
import { DatabaseSection } from "./email-campaign/DatabaseSection";
import { BlacklistSection } from "./email-campaign/BlacklistSection";
import { FormFooter } from "./email-campaign/FormFooter";
import { formSchema, FormData, defaultValues } from "./email-campaign/schema";
import { createEmailCampaignRequest } from "@/services/requestService";

export const EmailCampaignForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [blacklistAccountsTab, setBlacklistAccountsTab] = useState("file");
  const [blacklistEmailsTab, setBlacklistEmailsTab] = useState("file");
  const [fileUploading, setFileUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: FormData) => {
    if (fileUploading) {
      toast.error("Veuillez attendre la fin du téléchargement des fichiers");
      return;
    }

    setSubmitting(true);
    
    try {
      console.log("Données soumises:", data);
      
      // Format the data for the email request
      const requestData = {
        title: data.title,
        missionId: data.missionId,
        createdBy: user?.id,
        template: {
          content: data.templateContent,
          fileUrl: data.templateFileUrl,
          webLink: data.templateWebLink
        },
        database: {
          fileUrl: data.databaseFileUrl,
          webLink: data.databaseWebLink,
          notes: data.databaseNotes
        },
        blacklist: {
          accounts: {
            fileUrl: data.blacklistAccountsFileUrl,
            notes: data.blacklistAccountsNotes
          },
          emails: {
            fileUrl: data.blacklistEmailsFileUrl,
            notes: data.blacklistEmailsNotes
          }
        },
        dueDate: data.dueDate
      };
      
      // Créer une nouvelle demande d'email dans le mock data
      const newRequest = createEmailCampaignRequest(requestData);
      
      console.log("Nouvelle demande créée:", newRequest);
      
      toast.success("Demande de campagne email créée avec succès");
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error("Erreur lors de la création de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (field: string, files: FileList | null | string) => {
    if (typeof files === 'string') {
      // Si files est une chaîne (URL directe), l'affecter directement
      form.setValue(field as any, files);
    } else if (files && files.length > 0) {
      const file = files[0];
      const fakeUrl = `uploads/${file.name}`;
      form.setValue(field as any, fakeUrl);
    } else if (files === null) {
      // Effacer le champ si null
      form.setValue(field as any, "");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormHeader control={form.control} user={user} />
        <TemplateSection control={form.control} handleFileUpload={handleFileUpload} />
        <DatabaseSection 
          control={form.control} 
          handleFileUpload={handleFileUpload}
        />
        <BlacklistSection 
          control={form.control} 
          blacklistAccountsTab={blacklistAccountsTab}
          setBlacklistAccountsTab={setBlacklistAccountsTab}
          blacklistEmailsTab={blacklistEmailsTab}
          setBlacklistEmailsTab={setBlacklistEmailsTab}
          handleFileUpload={handleFileUpload}
        />
        <FormFooter submitting={submitting || fileUploading} />
      </form>
    </Form>
  );
};
