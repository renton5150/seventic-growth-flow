
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
import { TargetingOptional } from "@/types/targeting";
import { uploadBlacklistFile } from "@/services/database/uploadService";
import { ensureAllBucketsExist } from "@/services/database/config";
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
  const [isFormReady, setIsFormReady] = useState(false);
  const [bucketsReady, setBucketsReady] = useState(false);

  const form = useForm<DatabaseCreationFormData>({
    resolver: zodResolver(databaseCreationSchema),
    defaultValues,
    mode: "onChange"
  });

  useEffect(() => {
    const initializeBuckets = async () => {
      console.log("DatabaseCreationForm - Initialisation des buckets Supabase");
      try {
        const success = await ensureAllBucketsExist();
        setBucketsReady(success);
        if (!success) {
          toast.error("Erreur lors de l'initialisation du stockage");
        } else {
          console.log("DatabaseCreationForm - Buckets initialisés avec succès");
        }
      } catch (error) {
        console.error("DatabaseCreationForm - Erreur initialisation buckets:", error);
        toast.error("Erreur lors de l'initialisation du stockage");
      }
    };

    initializeBuckets();
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      console.log("DatabaseCreationForm - Initialisation du formulaire");
      
      // Attendre un court délai pour s'assurer que tous les contextes sont prêts
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (editMode && initialData) {
        console.log("DatabaseCreationForm - Mode édition - données initiales:", initialData);
        
        // Gérer le blacklist avec des valeurs par défaut sûres
        const safeBlacklist = initialData.blacklist || {
          accounts: { notes: "", fileUrl: "", fileUrls: [] },
          emails: { notes: "", fileUrl: "", fileUrls: [] }
        };
        
        // S'assurer que les sous-objets existent
        const accounts = safeBlacklist.accounts || { notes: "", fileUrl: "", fileUrls: [] };
        const emails = safeBlacklist.emails || { notes: "", fileUrl: "", fileUrls: [] };
        
        // Conversion stricte du tool avec vérification de type
        const safeTool: "Hubspot" | "Apollo" = (initialData.tool === "Apollo") ? "Apollo" : "Hubspot";
        console.log("DatabaseCreationForm - Tool converti:", safeTool);
        
        // Convertir les arrays en strings pour l'affichage dans les textareas
        const targeting: TargetingOptional = initialData.targeting || {};
        
        const formData: DatabaseCreationFormData = {
          title: initialData.title || "",
          missionId: initialData.missionId || "",
          tool: safeTool,
          // Conversion sécurisée des propriétés de ciblage avec optional chaining
          jobTitles: Array.isArray(targeting.jobTitles) 
            ? targeting.jobTitles.join('\n') 
            : (typeof targeting.jobTitles === 'string' ? targeting.jobTitles : ""),
          industries: Array.isArray(targeting.industries) 
            ? targeting.industries.join('\n') 
            : (typeof targeting.industries === 'string' ? targeting.industries : ""),
          locations: Array.isArray(targeting.locations) 
            ? targeting.locations.join('\n') 
            : (typeof targeting.locations === 'string' ? targeting.locations : ""),
          companySize: Array.isArray(targeting.companySize) 
            ? targeting.companySize.join('\n') 
            : (typeof targeting.companySize === 'string' ? targeting.companySize : ""),
          otherCriteria: targeting.otherCriteria || "",
          blacklistAccountsNotes: accounts.notes || "",
          blacklistEmailsNotes: emails.notes || "",
          blacklistAccountsFileUrls: accounts.fileUrls || (accounts.fileUrl ? [accounts.fileUrl] : []),
          blacklistEmailsFileUrls: emails.fileUrls || (emails.fileUrl ? [emails.fileUrl] : []),
        };
        
        console.log("DatabaseCreationForm - Données du formulaire préparées:", formData);
        form.reset(formData);
      }
      
      setIsFormReady(true);
      console.log("DatabaseCreationForm - Formulaire initialisé et prêt");
    };

    initializeForm();
  }, [editMode, initialData, form]);

  const handleFileUpload = async (field: string, files: FileList | null | string) => {
    console.log(`DatabaseCreationForm - handleFileUpload appelé pour ${field}:`, { files, type: typeof files });
    
    // Cas 1: Suppression de fichier (null)
    if (files === null) {
      console.log(`DatabaseCreationForm - Suppression des fichiers pour ${field}`);
      form.setValue(field as keyof DatabaseCreationFormData, [] as any);
      form.trigger(field as keyof DatabaseCreationFormData);
      return;
    }
    
    // Cas 2: URL existante (string) - ne rien faire
    if (typeof files === 'string') {
      console.log(`DatabaseCreationForm - URL de fichier reçue pour ${field}:`, files);
      return;
    }
    
    // Cas 3: Nouveaux fichiers à télécharger (FileList)
    if (!files || files.length === 0 || !user?.id) {
      console.log("DatabaseCreationForm - Pas de fichiers valides ou utilisateur non connecté");
      return;
    }

    if (!bucketsReady) {
      console.error("DatabaseCreationForm - Les buckets ne sont pas prêts");
      toast.error("Le système de stockage n'est pas prêt. Veuillez réessayer.");
      return;
    }

    const file = files[0];
    if (!file) {
      console.log("DatabaseCreationForm - Aucun fichier dans la FileList");
      return;
    }

    console.log(`DatabaseCreationForm - Téléchargement du fichier pour ${field}:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      userId: user.id
    });

    try {
      // Afficher un toast de chargement
      const loadingToast = toast.loading(`Téléchargement de "${file.name}" en cours...`);
      
      // Télécharger le fichier vers Supabase Storage
      console.log("DatabaseCreationForm - Appel à uploadBlacklistFile...");
      const fileUrl = await uploadBlacklistFile(file);
      console.log("DatabaseCreationForm - Résultat uploadBlacklistFile:", fileUrl);
      
      // Supprimer le toast de chargement
      toast.dismiss(loadingToast);
      
      if (fileUrl) {
        console.log(`DatabaseCreationForm - Fichier téléchargé avec succès: ${fileUrl}`);
        
        // Mettre à jour le champ du formulaire avec l'URL du fichier
        const currentUrls = form.getValues(field as keyof DatabaseCreationFormData) as string[] || [];
        const newUrls = [...currentUrls, fileUrl];
        
        console.log(`DatabaseCreationForm - Mise à jour du champ ${field}:`, {
          currentUrls,
          newUrls,
          fieldValue: form.getValues(field as keyof DatabaseCreationFormData)
        });
        
        form.setValue(field as keyof DatabaseCreationFormData, newUrls as any);
        
        // Forcer la re-validation du formulaire
        form.trigger(field as keyof DatabaseCreationFormData);
        
        // Vérifier que la valeur a bien été mise à jour
        const updatedValue = form.getValues(field as keyof DatabaseCreationFormData);
        console.log(`DatabaseCreationForm - Valeur après mise à jour pour ${field}:`, updatedValue);
        
        toast.success(`Fichier "${file.name}" téléchargé avec succès`);
      } else {
        console.error("DatabaseCreationForm - uploadBlacklistFile a retourné null ou undefined");
        toast.error("Erreur lors du téléchargement du fichier - Aucune URL retournée");
      }
    } catch (error) {
      console.error("DatabaseCreationForm - Erreur lors du téléchargement:", error);
      console.error("DatabaseCreationForm - Stack trace:", error instanceof Error ? error.stack : 'Pas de stack trace');
      toast.error(`Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const onSubmit = async (data: DatabaseCreationFormData) => {
    setSubmitting(true);
    console.log("DatabaseCreationForm - Données du formulaire:", data);

    // Préparer les données pour Supabase avec conversion des dates en strings ISO
    const now = new Date();
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Fonction utilitaire pour convertir les strings en arrays
    const stringToArray = (str: string): string[] => {
      if (!str || str.trim() === "") return [];
      return str.split('\n').map(item => item.trim()).filter(item => item.length > 0);
    };

    const requestData = {
      title: data.title,
      type: "database",
      status: "pending",
      workflow_status: "pending_assignment",
      created_by: user?.id,
      mission_id: data.missionId,
      created_at: now.toISOString(),
      last_updated: now.toISOString(),
      due_date: dueDate.toISOString(),
      target_role: "growth",
      details: {
        tool: data.tool,
        targeting: {
          // Convertir les strings en arrays pour la base de données
          jobTitles: stringToArray(data.jobTitles),
          industries: stringToArray(data.industries),
          locations: stringToArray(data.locations),
          companySize: stringToArray(data.companySize),
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
          console.error("DatabaseCreationForm - Erreur lors de la mise à jour de la demande:", error);
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
          console.error("DatabaseCreationForm - Erreur lors de la création de la demande:", error);
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
      console.error("DatabaseCreationForm - Erreur inattendue:", error);
      toast.error("Erreur inattendue");
    } finally {
      setSubmitting(false);
    }
  };

  // Afficher un indicateur de chargement pendant l'initialisation
  if (!isFormReady) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600">Initialisation du formulaire...</span>
        </div>
      </div>
    );
  }

  if (!bucketsReady) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600">Initialisation du stockage...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormHeader 
            editMode={editMode} 
            control={form.control}
            user={user}
          />
          
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
