
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
import { createEmailCampaignRequest, updateRequest } from "@/services/requestService";
import { supabase } from "@/integrations/supabase/client";
import { uploadDatabaseFile, uploadTemplateFile, uploadBlacklistFile } from "@/services/database/uploadService";
import { EmailCampaignRequest } from "@/types/types";

interface EmailCampaignFormProps {
  editMode?: boolean;
  initialData?: EmailCampaignRequest;
  onSuccess?: () => void;
}

export const EmailCampaignForm = ({ editMode = false, initialData, onSuccess }: EmailCampaignFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [blacklistAccountsTab, setBlacklistAccountsTab] = useState("file");
  const [blacklistEmailsTab, setBlacklistEmailsTab] = useState("file");
  const [fileUploading, setFileUploading] = useState(false);

  const getInitialValues = () => {
    if (editMode && initialData) {
      console.log("Initialisation du formulaire d'édition avec les valeurs de mission:", initialData);
      
      const template = initialData.template || {
        content: "",
        fileUrl: "",
        webLink: ""
      };
      
      const database = initialData.database || {
        notes: "",
        fileUrl: "",
        webLinks: []
      };
      
      const databaseWebLinks = [...(database.webLinks || [])];
      while (databaseWebLinks.length < 5) {
        databaseWebLinks.push("");
      }
      
      const blacklist = initialData.blacklist || {
        accounts: { notes: "", fileUrl: "" },
        emails: { notes: "", fileUrl: "" }
      };
      
      const blacklistAccounts = blacklist.accounts || { notes: "", fileUrl: "" };
      const blacklistEmails = blacklist.emails || { notes: "", fileUrl: "" };

      const dueDate = initialData.dueDate ? new Date(initialData.dueDate) : new Date();
      const formattedDueDate = dueDate.toISOString().split('T')[0];

      console.log("ID de mission utilisé:", initialData.missionId);

      return {
        title: initialData.title || "",
        emailType: initialData.details?.emailType || "Mass email",
        missionId: initialData.missionId || "",
        dueDate: formattedDueDate,
        templateContent: template.content || "",
        templateFileUrl: template.fileUrl || "",
        templateWebLink: template.webLink || "",
        databaseFileUrl: database.fileUrl || "",
        databaseWebLinks,
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
  
  useEffect(() => {
    if (editMode && initialData) {
      const values = getInitialValues();
      form.reset(values);
    }
  }, [editMode, initialData, form]);

  useEffect(() => {
    if (editMode && initialData && initialData.blacklist) {
      const blacklist = initialData.blacklist || {
        accounts: { notes: "", fileUrl: "" },
        emails: { notes: "", fileUrl: "" }
      };
      
      const accounts = blacklist.accounts || { notes: "", fileUrl: "" };
      const emails = blacklist.emails || { notes: "", fileUrl: "" };

      if (accounts.notes && !accounts.fileUrl) {
        setBlacklistAccountsTab("notes");
      }

      if (emails.notes && !emails.fileUrl) {
        setBlacklistEmailsTab("notes");
      }
    }
  }, [editMode, initialData]);

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
  
  useEffect(() => {
    if (editMode) {
      console.log("Valeurs actuelles du formulaire:", form.getValues());
      console.log("Mission ID dans le formulaire:", form.getValues("missionId"));
    }
  }, [editMode, form]);

  const handleFileUpload = async (field: string, files: FileList | null | string) => {
    if (typeof files === 'string') {
      console.log("URL directe fournie:", files);
      form.setValue(field as any, files);
      setFileUploading(false);
      return;
    }
    
    if (!files || files.length === 0) {
      console.log("Effacement du fichier");
      form.setValue(field as any, "");
      setFileUploading(false);
      return;
    }
    
    setFileUploading(true);
    const file = files[0];
    console.log(`Téléchargement du fichier pour le champ: ${field}, fichier: ${file.name}`);
    
    try {
      let fileUrl: string | null = null;
      
      // Déterminer le type d'upload en fonction du champ
      if (field === "templateFileUrl") {
        fileUrl = await uploadTemplateFile(file);
      } else if (field === "databaseFileUrl") {
        if (user) {
          const result = await uploadDatabaseFile(file, user.id);
          if (result.success) {
            fileUrl = result.fileUrl || null;
          }
        }
      } else if (field === "blacklistAccountsFileUrl" || field === "blacklistEmailsFileUrl") {
        fileUrl = await uploadBlacklistFile(file);
      }
      
      if (fileUrl) {
        form.setValue(field as any, fileUrl);
        console.log(`Fichier téléversé avec succès pour ${field}: ${fileUrl}`);
      } else {
        console.error(`Échec du téléversement pour ${field}`);
        toast.error("Échec du téléversement du fichier");
      }
    } catch (error) {
      console.error("Erreur lors du téléversement:", error);
      toast.error("Erreur lors du téléversement du fichier");
    } finally {
      setFileUploading(false);
    }
  };

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
      
      const dueDate = new Date(data.dueDate);
      
      const requestData = {
        title: data.title,
        emailType: data.emailType,
        missionId: data.missionId,
        createdBy: user.id,
        template: {
          content: data.templateContent || "",
          fileUrl: data.templateFileUrl || "",
          webLink: data.templateWebLink || ""
        },
        database: {
          fileUrl: data.databaseFileUrl || "",
          webLinks: data.databaseWebLinks.filter(link => !!link),
          notes: data.databaseNotes || ""
        },
        blacklist: {
          accounts: {
            fileUrl: data.blacklistAccountsFileUrl || "",
            notes: data.blacklistAccountsNotes || ""
          },
          emails: {
            fileUrl: data.blacklistEmailsFileUrl || "",
            notes: data.blacklistEmailsNotes || ""
          }
        },
        dueDate: dueDate
      };
      
      let result;
      
      if (editMode && initialData) {
        console.log("Mise à jour de la demande avec:", requestData);
        result = await updateRequest(initialData.id, {
          title: data.title,
          dueDate: dueDate,
          emailType: data.emailType,
          template: requestData.template,
          database: requestData.database,
          blacklist: requestData.blacklist
        });
        
        if (result) {
          console.log("Demande mise à jour:", result);
          toast.success(editMode ? "Demande mise à jour avec succès" : "Demande créée avec succès");
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/dashboard");
          }
        } else {
          throw new Error("Erreur lors de la mise à jour de la demande");
        }
      } else {
        console.log("Création de la demande avec:", requestData);
        const newRequest = await createEmailCampaignRequest(requestData);
        
        if (newRequest) {
          console.log("Nouvelle demande créée:", newRequest);
          toast.success(editMode ? "Demande mise à jour avec succès" : "Demande créée avec succès");
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
        <FormFooter submitting={submitting || fileUploading} editMode={editMode} />
      </form>
    </Form>
  );
};
