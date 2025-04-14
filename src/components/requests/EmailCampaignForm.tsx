
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
import { EmailCampaignRequest } from "@/types/types";

interface EmailCampaignFormProps {
  editMode?: boolean;
  initialData?: EmailCampaignRequest;
}

export const EmailCampaignForm = ({ editMode = false, initialData }: EmailCampaignFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [blacklistAccountsTab, setBlacklistAccountsTab] = useState("file");
  const [blacklistEmailsTab, setBlacklistEmailsTab] = useState("file");
  const [fileUploading, setFileUploading] = useState(false);

  // Préparer les valeurs initiales en mode édition
  const getInitialValues = () => {
    if (editMode && initialData) {
      // S'assurer que toutes les propriétés ont des valeurs par défaut
      const template = initialData.template || {
        content: "",
        fileUrl: "",
        webLink: ""
      };
      
      const database = initialData.database || {
        notes: "",
        fileUrl: "",
        webLink: ""
      };
      
      const blacklist = initialData.blacklist || {
        accounts: { notes: "", fileUrl: "" },
        emails: { notes: "", fileUrl: "" }
      };
      
      // S'assurer que ces objets existent avec des valeurs par défaut
      const blacklistAccounts = blacklist.accounts || { notes: "", fileUrl: "" };
      const blacklistEmails = blacklist.emails || { notes: "", fileUrl: "" };

      // Adapter la date pour le format de l'input date
      const dueDate = initialData.dueDate ? new Date(initialData.dueDate) : new Date();
      const formattedDueDate = dueDate.toISOString().split('T')[0];

      return {
        title: initialData.title || "",
        missionId: initialData.missionId || "",
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
    if (editMode && initialData && initialData.blacklist) {
      const blacklist = initialData.blacklist || {
        accounts: { notes: "", fileUrl: "" },
        emails: { notes: "", fileUrl: "" }
      };
      
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
      
      // Convertir la date string en objet Date
      const dueDate = new Date(data.dueDate);
      
      // Format the data for the request
      const requestData = {
        title: data.title,
        missionId: data.missionId,
        createdBy: user.id,
        template: {
          content: data.templateContent || "",
          fileUrl: data.templateFileUrl || "",
          webLink: data.templateWebLink || ""
        },
        database: {
          fileUrl: data.databaseFileUrl || "",
          webLink: data.databaseWebLink || "",
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
        // Mode édition - Mettre à jour la demande existante
        console.log("Mise à jour de la demande avec:", requestData);
        result = await updateRequest(initialData.id, {
          title: data.title,
          dueDate: dueDate,
          // Mise à jour directe des propriétés au lieu d'utiliser details
          template: requestData.template,
          database: requestData.database,
          blacklist: requestData.blacklist
        });
        
        if (result) {
          console.log("Demande mise à jour:", result);
          toast.success("Demande de campagne email mise à jour avec succès");
          navigate("/requests/email/" + initialData.id);
        } else {
          throw new Error("Erreur lors de la mise à jour de la demande");
        }
      } else {
        // Mode création - Créer une nouvelle demande
        console.log("Création de la demande avec:", requestData);
        const newRequest = await createEmailCampaignRequest(requestData);
        
        if (newRequest) {
          console.log("Nouvelle demande créée:", newRequest);
          toast.success("Demande de campagne email créée avec succès");
          navigate("/dashboard");
        } else {
          throw new Error("Erreur lors de la création de la demande");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      // Afficher plus de détails sur l'erreur
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur inconnue lors de la création/modification de la demande";
      toast.error(`Erreur: ${errorMessage}`);
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
