
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { FormHeader } from "./database-creation/FormHeader";
import { TargetingSection } from "./database-creation/TargetingSection";
import { BlacklistSection } from "./database-creation/BlacklistSection";
import { FormFooter } from "./database-creation/FormFooter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DatabaseRequest } from "@/types/types";
import { databaseCreationSchema, DatabaseCreationFormData, defaultValues } from "./database-creation/schema";

interface DatabaseCreationFormProps {
  editMode?: boolean;
  initialData?: DatabaseRequest;
  onSuccess?: () => void;
}

export const DatabaseCreationForm = ({ editMode = false, initialData, onSuccess }: DatabaseCreationFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [blacklistAccountsTab, setBlacklistAccountsTab] = useState("file");
  const [blacklistContactsTab, setBlacklistContactsTab] = useState("file");

  const form = useForm<DatabaseCreationFormData>({
    resolver: zodResolver(databaseCreationSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editMode && initialData) {
      console.log("Mode édition - données initiales:", initialData);
      
      // Gérer le blacklist avec des valeurs par défaut sûres
      const safeBlacklist = initialData.blacklist || {
        accounts: { notes: "", fileUrl: "", fileUrls: [] },
        emails: { notes: "", fileUrl: "", fileUrls: [] }
      };
      
      // S'assurer que les sous-objets existent
      const accounts = safeBlacklist.accounts || { notes: "", fileUrl: "", fileUrls: [] };
      const emails = safeBlacklist.emails || { notes: "", fileUrl: "", fileUrls: [] };
      
      const formData: DatabaseCreationFormData = {
        title: initialData.title || "",
        missionId: initialData.missionId || "",
        tool: (initialData.tool === "Hubspot" || initialData.tool === "Apollo") ? initialData.tool : "Hubspot",
        jobTitles: initialData.targeting?.jobTitles || [],
        industries: initialData.targeting?.industries || [],
        locations: initialData.targeting?.locations || [],
        companySize: initialData.targeting?.companySize || [],
        otherCriteria: initialData.targeting?.otherCriteria || "",
        blacklistAccountsNotes: accounts.notes || "",
        blacklistEmailsNotes: emails.notes || "",
        blacklistAccountsFileUrls: accounts.fileUrls || (accounts.fileUrl ? [accounts.fileUrl] : []),
        blacklistEmailsFileUrls: emails.fileUrls || (emails.fileUrl ? [emails.fileUrl] : []),
      };
      
      console.log("Données du formulaire préparées:", formData);
      form.reset(formData);
    }
  }, [editMode, initialData, form]);

  const handleFileUpload = (field: string, files: FileList | null | string) => {
    if (files) {
      console.log(`Fichiers sélectionnés pour ${field}:`, files);
      // Handle file upload logic here
    }
  };

  const onSubmit = async (data: DatabaseCreationFormData) => {
    setSubmitting(true);
    console.log("Données du formulaire:", data);

    // Préparer les données pour Supabase avec les types corrects
    const requestData = {
      title: data.title,
      type: "database",
      status: "pending",
      workflow_status: "pending_assignment",
      created_by: user?.id,
      mission_id: data.missionId,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours plus tard
      details: {
        tool: data.tool,
        targeting: {
          jobTitles: data.jobTitles,
          industries: data.industries,
          locations: data.locations,
          companySize: data.companySize,
          otherCriteria: data.otherCriteria,
        },
        blacklist: {
          accounts: {
            notes: data.blacklistAccountsNotes,
            fileUrls: data.blacklistAccountsFileUrls,
          },
          emails: {
            notes: data.blacklistEmailsNotes,
            fileUrls: data.blacklistEmailsFileUrls,
          },
        },
      },
    };

    try {
      if (editMode && initialData) {
        // Update existing request
        const { error } = await supabase
          .from("requests")
          .update({
            title: requestData.title,
            details: requestData.details,
            last_updated: requestData.last_updated,
            mission_id: requestData.mission_id,
          })
          .eq("id", initialData.id);

        if (error) {
          console.error("Erreur lors de la mise à jour de la demande:", error);
          toast.error("Erreur lors de la mise à jour de la demande");
        } else {
          toast.success("Demande mise à jour avec succès!");
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        // Create new request
        const { error } = await supabase.from("requests").insert([requestData]);

        if (error) {
          console.error("Erreur lors de la création de la demande:", error);
          toast.error("Erreur lors de la création de la demande");
        } else {
          toast.success("Demande créée avec succès!");
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/dashboard");
          }
        }
      }
    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast.error("Erreur inattendue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FormHeader 
        editMode={editMode} 
        control={form.control}
        user={user}
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TargetingSection 
            control={form.control}
          />
          <BlacklistSection 
            control={form.control}
            blacklistAccountsTab={blacklistAccountsTab}
            setBlacklistAccountsTab={setBlacklistAccountsTab}
            blacklistContactsTab={blacklistContactsTab}
            setBlacklistContactsTab={setBlacklistContactsTab}
            handleFileUpload={handleFileUpload}
          />
          <FormFooter 
            submitting={submitting} 
            editMode={editMode}
          />
        </form>
      </Form>
    </div>
  );
};
