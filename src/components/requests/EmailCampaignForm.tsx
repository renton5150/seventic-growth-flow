
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

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

  // Vérifier que le client Supabase est correctement initialisé
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        console.log("Vérification de la connexion Supabase...");
        const { data, error } = await supabase.from("missions").select("count").limit(1);
        if (error) {
          console.error("Erreur de connexion Supabase:", error);
        } else {
          console.log("Connexion Supabase OK");
        }
      } catch (err) {
        console.error("Erreur lors de la vérification de la connexion Supabase:", err);
      }
    };
    
    checkSupabaseConnection();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (fileUploading) {
      toast.error("Veuillez attendre la fin du téléchargement des fichiers");
      return;
    }

    if (!user) {
      toast.error("Vous devez être connecté pour créer une requête");
      return;
    }

    setSubmitting(true);
    
    try {
      console.log("Données soumises:", data);
      
      // Format the data for the email request
      const requestData = {
        title: data.title,
        missionId: data.missionId,
        createdBy: user.id,
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
      
      console.log("Création de la demande avec:", requestData);
      const newRequest = await createEmailCampaignRequest(requestData);
      
      if (newRequest) {
        console.log("Nouvelle demande créée:", newRequest);
        toast.success("Demande de campagne email créée avec succès");
        navigate("/dashboard");
      } else {
        throw new Error("Erreur lors de la création de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error("Erreur lors de la création de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (field: string, files: FileList | null | string) => {
    setFileUploading(true);
    console.log("Téléchargement du fichier pour le champ:", field, files);
    try {
      // Cas où files est une chaîne (URL directe)
      if (typeof files === 'string') {
        console.log("URL directe fournie:", files);
        form.setValue(field as any, files);
        return;
      }
      
      // Cas où files est une FileList
      if (files && files.length > 0) {
        const file = files[0];
        console.log("Fichier sélectionné:", file.name);
        const fakeUrl = `uploads/${file.name}`;
        form.setValue(field as any, fakeUrl);
        return;
      }
      
      // Cas où files est null (effacement)
      console.log("Effacement du fichier");
      form.setValue(field as any, "");
    } finally {
      // Toujours remettre fileUploading à false après traitement
      setTimeout(() => setFileUploading(false), 100);
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
