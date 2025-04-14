
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { FormHeader } from "./email-campaign/FormHeader";
import { TemplateSection } from "./email-campaign/TemplateSection";
import { DatabaseSection } from "./email-campaign/DatabaseSection";
import { BlacklistSection } from "./email-campaign/BlacklistSection";
import { FormFooter } from "./email-campaign/FormFooter";
import { formSchema, FormData, defaultValues } from "./email-campaign/schema";
import { EmailCampaignRequest } from "@/types/types";
import { useFileUpload } from "@/hooks";
import { useEmailCampaignSubmit } from "@/hooks/useEmailCampaignSubmit";
import { supabase } from "@/integrations/supabase/client";

interface EmailCampaignFormProps {
  editMode?: boolean;
  initialData?: EmailCampaignRequest;
}

export const EmailCampaignForm = ({ editMode = false, initialData }: EmailCampaignFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blacklistAccountsTab, setBlacklistAccountsTab] = useState("file");
  const [blacklistEmailsTab, setBlacklistEmailsTab] = useState("file");
  const { uploading: fileUploading, handleFileUpload } = useFileUpload();
  const { submitting, handleSubmit: submitForm } = useEmailCampaignSubmit({ 
    editMode, 
    initialDataId: initialData?.id,
    fileUploading 
  });

  // Préparer les valeurs initiales en mode édition
  const getInitialValues = () => {
    if (editMode && initialData) {
      // Ensure all objects exist with safe defaults
      const template = initialData.template || { content: "", fileUrl: "", webLink: "" };
      const database = initialData.database || { notes: "", fileUrl: "", webLink: "" };
      const blacklist = initialData.blacklist || {};
      const blacklistAccounts = blacklist.accounts || { notes: "", fileUrl: "" };
      const blacklistEmails = blacklist.emails || { notes: "", fileUrl: "" };

      // Adapter la date pour le format de l'input date
      const dueDate = new Date(initialData.dueDate);
      const formattedDueDate = dueDate.toISOString().split('T')[0];

      return {
        title: initialData.title,
        missionId: initialData.missionId,
        dueDate: formattedDueDate,
        templateContent: template.content || "",
        templateFileUrl: template.fileUrl || "",
        templateWebLink: template.webLink || "",
        databaseFileUrl: database.fileUrl || "",
        databaseWebLink: database.webLink || "",
        databaseNotes: database.notes || "",
        blacklistAccountsFileUrl: blacklistAccounts.fileUrl || "",
        blacklistAccountsNotes: blacklistAccounts.notes || "",
        blacklistEmailsFileUrl: blacklistEmails.fileUrl || "",
        blacklistEmailsNotes: blacklistEmails.notes || "",
      };
    }
    return defaultValues;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues()
  });

  // Initialiser les onglets actifs en fonction des données
  useEffect(() => {
    if (editMode && initialData) {
      const blacklist = initialData.blacklist || {};
      const accounts = blacklist.accounts || { notes: "", fileUrl: "" };
      const emails = blacklist.emails || { notes: "", fileUrl: "" };

      // Définir l'onglet actif pour les comptes blacklist
      if (accounts.notes && !accounts.fileUrl) {
        setBlacklistAccountsTab("notes");
      }

      // Définir l'onglet actif pour les emails blacklist
      if (emails.notes && !emails.fileUrl) {
        setBlacklistEmailsTab("notes");
      }
    }
  }, [editMode, initialData]);

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
    await submitForm(data, user, navigate);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormHeader control={form.control} user={user} editMode={editMode} />
        <TemplateSection control={form.control} handleFileUpload={(files) => 
          handleFileUpload(form.setValue, "templateFileUrl", files, { 
            acceptedFormats: ["doc", "docx", "html", "htm"], 
            maxSize: 10 
          })
        } />
        <DatabaseSection 
          control={form.control} 
          handleFileUpload={(files) => 
            handleFileUpload(form.setValue, "databaseFileUrl", files, { 
              acceptedFormats: ["csv", "xls", "xlsx"], 
              maxSize: 50 
            })
          }
        />
        <BlacklistSection 
          control={form.control} 
          blacklistAccountsTab={blacklistAccountsTab}
          setBlacklistAccountsTab={setBlacklistAccountsTab}
          blacklistEmailsTab={blacklistEmailsTab}
          setBlacklistEmailsTab={setBlacklistEmailsTab}
          handleFileUpload={{
            accounts: (files) => handleFileUpload(form.setValue, "blacklistAccountsFileUrl", files, { 
              acceptedFormats: ["csv", "xls", "xlsx"], 
              maxSize: 10 
            }),
            emails: (files) => handleFileUpload(form.setValue, "blacklistEmailsFileUrl", files, { 
              acceptedFormats: ["csv", "xls", "xlsx"], 
              maxSize: 10 
            })
          }}
        />
        <FormFooter submitting={submitting || fileUploading} editMode={editMode} />
      </form>
    </Form>
  );
};
