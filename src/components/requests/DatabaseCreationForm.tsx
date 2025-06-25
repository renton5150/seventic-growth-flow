
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
import { databaseCreationSchema, type DatabaseCreationFormData } from "./database-creation/schema";
import { useMissions } from "@/hooks/requests/useMissions";
import { createDatabaseRequest, updateDatabaseRequest } from "@/services/requests/databaseRequestService";
import { getRequestById } from "@/services/requests/requestService";
import { useAuth } from "@/contexts/AuthContext";
import { uploadBlacklistFile } from "@/services/database/uploadService";
import { DatabaseRequest } from "@/types/types";

export const DatabaseCreationForm = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const { data: missions = [], isLoading: missionsLoading } = useMissions();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [blacklistAccountsTab, setBlacklistAccountsTab] = useState("file");
  const [blacklistContactsTab, setBlacklistContactsTab] = useState("file");

  const isEditMode = requestId && requestId !== "new";

  const form = useForm<DatabaseCreationFormData>({
    resolver: zodResolver(databaseCreationSchema),
    defaultValues: {
      title: "",
      missionId: "",
      dueDate: "",
      tool: "",
      icp: "",
      jobTitles: "",
      locations: "",
      companySize: "",
      industries: "",
      additionalCriteria: "",
      blacklistAccountsFileUrls: [],
      blacklistAccountsNotes: "",
      blacklistEmailsFileUrls: [],
      blacklistEmailsNotes: "",
    },
  });

  // Charger les données si on est en mode édition
  useEffect(() => {
    const loadRequestData = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);
        const request = await getRequestById(requestId) as DatabaseRequest;
        
        if (!request) {
          toast.error("Demande non trouvée");
          navigate("/dashboard");
          return;
        }

        // Pré-remplir le formulaire avec les données existantes
        const formData: DatabaseCreationFormData = {
          title: request.title || "",
          missionId: request.missionId || "",
          dueDate: request.dueDate ? new Date(request.dueDate).toISOString().split('T')[0] : "",
          tool: request.tool || "",
          icp: request.targeting?.icp || "",
          jobTitles: request.targeting?.jobTitles || "",
          locations: request.targeting?.locations || "",
          companySize: request.targeting?.companySize || "",
          industries: request.targeting?.industries || "",
          additionalCriteria: request.targeting?.additionalCriteria || "",
          blacklistAccountsFileUrls: request.blacklist?.accounts?.fileUrls || [],
          blacklistAccountsNotes: request.blacklist?.accounts?.notes || "",
          blacklistEmailsFileUrls: request.blacklist?.emails?.fileUrls || [],
          blacklistEmailsNotes: request.blacklist?.emails?.notes || "",
        };

        form.reset(formData);
      } catch (error) {
        console.error("Erreur lors du chargement de la demande:", error);
        toast.error("Erreur lors du chargement de la demande");
      } finally {
        setIsLoading(false);
      }
    };

    loadRequestData();
  }, [isEditMode, requestId, form, navigate]);

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
          icp: data.icp,
          jobTitles: data.jobTitles,
          locations: data.locations,
          companySize: data.companySize,
          industries: data.industries,
          additionalCriteria: data.additionalCriteria,
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
      if (isEditMode) {
        result = await updateDatabaseRequest(requestId, requestData);
      } else {
        result = await createDatabaseRequest(requestData);
      }

      if (result) {
        toast.success(isEditMode ? "Demande mise à jour avec succès !" : "Demande créée avec succès !");
        navigate("/dashboard");
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
          isEditMode={isEditMode}
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
          isSubmitting={isSubmitting}
          isEditMode={isEditMode}
        />
      </form>
    </Form>
  );
};
