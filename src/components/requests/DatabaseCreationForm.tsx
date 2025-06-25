
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { FormHeader } from "./database-creation/FormHeader";
import { TargetingSection } from "./database-creation/TargetingSection";
import { BlacklistSection } from "./database-creation/BlacklistSection";
import { FormFooter } from "./database-creation/FormFooter";
import { databaseCreationSchema, type DatabaseCreationFormData, defaultValues } from "./database-creation/schema";
import { useMissions } from "@/hooks/useMissions";
import { createDatabaseRequest, updateDatabaseRequest } from "@/services/requests/databaseRequestService";
import { useAuth } from "@/contexts/AuthContext";
import { uploadBlacklistFile } from "@/services/database/uploadService";
import { DatabaseRequest } from "@/types/types";

interface DatabaseCreationFormProps {
  editMode?: boolean;
  initialData?: DatabaseRequest;
  onSuccess?: () => void;
}

export const DatabaseCreationForm = ({ editMode = false, initialData, onSuccess }: DatabaseCreationFormProps) => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const { data: missions = [], isLoading: missionsLoading } = useMissions();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [blacklistAccountsTab, setBlacklistAccountsTab] = useState("file");
  const [blacklistContactsTab, setBlacklistContactsTab] = useState("file");

  const isEditMode = editMode || (requestId && requestId !== "new");

  const form = useForm<DatabaseCreationFormData>({
    resolver: zodResolver(databaseCreationSchema),
    defaultValues,
  });

  // Charger les données si on est en mode édition
  useEffect(() => {
    if (isEditMode && initialData) {
      // Créer un objet targeting avec des valeurs par défaut
      const targeting = {
        jobTitles: [],
        industries: [],
        locations: [],
        companySize: [],
        otherCriteria: "",
        ...initialData.targeting // Étendre avec les vraies données si elles existent
      };
      
      const formData: DatabaseCreationFormData = {
        title: initialData.title || "",
        missionId: initialData.missionId || "",
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "",
        tool: (initialData.tool as "Hubspot" | "Apollo") || "Hubspot",
        jobTitles: Array.isArray(targeting.jobTitles) ? targeting.jobTitles.join('\n') : "",
        locations: Array.isArray(targeting.locations) ? targeting.locations.join('\n') : "",
        companySize: Array.isArray(targeting.companySize) ? targeting.companySize.join('\n') : "",
        industries: Array.isArray(targeting.industries) ? targeting.industries.join('\n') : "",
        otherCriteria: targeting.otherCriteria || "",
        blacklistAccountsFileUrls: initialData.blacklist?.accounts?.fileUrls || [],
        blacklistAccountsNotes: initialData.blacklist?.accounts?.notes || "",
        blacklistEmailsFileUrls: initialData.blacklist?.emails?.fileUrls || [],
        blacklistEmailsNotes: initialData.blacklist?.emails?.notes || "",
      };

      form.reset(formData);
    }
  }, [isEditMode, initialData, form]);

  const handleFileUpload = async (field: string, files: FileList | null | string) => {
    console.log(`DatabaseCreationForm - handleFileUpload appelé pour ${field}:`, { files, type: typeof files });
    
    if (!files) {
      console.log(`DatabaseCreationForm - Pas de fichiers pour ${field}, reset à []`);
      form.setValue(field as keyof DatabaseCreationFormData, [] as any);
      return;
    }

    if (typeof files === 'string') {
      console.log(`DatabaseCreationForm - Fichier string reçu pour ${field}:`, files);
      const urls = files.split(',').filter(Boolean);
      form.setValue(field as keyof DatabaseCreationFormData, urls as any);
      return;
    }

    if (files instanceof FileList && files.length > 0) {
      console.log(`DatabaseCreationForm - Upload de ${files.length} fichier(s) pour ${field}`);
      
      try {
        const uploadPromises = Array.from(files).map(file => uploadBlacklistFile(file));
        const results = await Promise.all(uploadPromises);
        
        const successfulUploads = results.filter(result => result.success);
        
        if (successfulUploads.length > 0) {
          const fileUrls = successfulUploads.map(result => result.fileUrl!);
          console.log(`DatabaseCreationForm - Upload réussi pour ${field}:`, fileUrls);
          
          form.setValue(field as keyof DatabaseCreationFormData, fileUrls as any);
          toast.success(`${successfulUploads.length} fichier(s) téléchargé(s) avec succès`);
        } else {
          console.error(`DatabaseCreationForm - Aucun upload réussi pour ${field}`);
          toast.error("Erreur lors du téléchargement des fichiers");
        }
      } catch (error) {
        console.error(`DatabaseCreationForm - Erreur upload ${field}:`, error);
        toast.error("Erreur lors du téléchargement des fichiers");
      }
    }
  };

  // Fonction utilitaire pour convertir string en array
  const stringToArray = (str: string): string[] => {
    return str.split('\n').map(item => item.trim()).filter(Boolean);
  };

  const onSubmit = async (data: DatabaseCreationFormData) => {
    if (!user?.id) {
      toast.error("Vous devez être connecté pour soumettre une demande");
      return;
    }

    if (missionsLoading) {
      toast.error("Chargement des missions en cours, veuillez patienter");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        title: data.title,
        missionId: data.missionId,
        createdBy: user.id,
        dueDate: data.dueDate,
        tool: data.tool,
        targeting: {
          jobTitles: stringToArray(data.jobTitles),
          locations: stringToArray(data.locations),
          companySize: stringToArray(data.companySize),
          industries: stringToArray(data.industries),
          otherCriteria: data.otherCriteria,
        },
        blacklist: {
          accounts: {
            fileUrls: data.blacklistAccountsFileUrls || [],
            notes: data.blacklistAccountsNotes || "",
          },
          emails: {
            fileUrls: data.blacklistEmailsFileUrls || [],
            notes: data.blacklistEmailsNotes || "",
          },
        },
      };

      let result;
      if (isEditMode && (requestId || initialData?.id)) {
        const idToUpdate = requestId || initialData?.id;
        result = await updateDatabaseRequest(idToUpdate!, requestData);
      } else {
        result = await createDatabaseRequest(requestData);
      }

      if (result) {
        toast.success(isEditMode ? "Demande mise à jour avec succès !" : "Demande créée avec succès !");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/dashboard");
        }
      } else {
        toast.error(isEditMode ? "Erreur lors de la mise à jour de la demande" : "Erreur lors de la création de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error("Une erreur s'est produite lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormHeader 
          control={form.control} 
          missions={missions}
          editMode={isEditMode}
        />
        
        <TargetingSection control={form.control} />
        
        <BlacklistSection
          control={form.control}
          blacklistAccountsTab={blacklistAccountsTab}
          setBlacklistAccountsTab={setBlacklistAccountsTab}
          blacklistContactsTab={blacklistContactsTab}
          setBlacklistContactsTab={setBlacklistContactsTab}
          handleFileUpload={handleFileUpload}
        />
        
        <FormFooter 
          submitting={isSubmitting}
          editMode={isEditMode}
        />
      </form>
    </Form>
  );
};
