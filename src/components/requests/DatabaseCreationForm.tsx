
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { FormHeader } from "./database-creation/FormHeader";
import { TargetingSection } from "./database-creation/TargetingSection";
import { BlacklistSection } from "./database-creation/BlacklistSection";
import { FormFooter } from "./database-creation/FormFooter";
import { formSchema, FormData, defaultValues } from "./database-creation/schema";
import { createDatabaseRequest, updateRequest } from "@/services/requestService";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseRequest } from "@/types/types";

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

  // Préparer les valeurs initiales en mode édition
  const getInitialValues = () => {
    if (editMode && initialData) {
      const targeting = initialData.targeting || {
        jobTitles: [],
        industries: [],
        locations: [],
        companySize: [],
        otherCriteria: ""
      };
      
      const blacklist = initialData.blacklist || {
        accounts: { notes: "", fileUrl: "" }
      };

      // Convert string date to Date object
      const dueDate = initialData.dueDate ? new Date(initialData.dueDate) : new Date();

      return {
        title: initialData.title || "",
        missionId: initialData.missionId || "",
        dueDate: dueDate,
        tool: initialData.tool || "Hubspot",
        jobTitles: targeting.jobTitles.join(", ") || "",
        industries: targeting.industries.join(", ") || "",
        locations: targeting.locations?.join(", ") || "",
        companySize: targeting.companySize.join(", ") || "",
        otherCriteria: targeting.otherCriteria || "",
        blacklistAccountsFileUrl: blacklist.accounts?.fileUrl || "",
        blacklistAccountsNotes: blacklist.accounts?.notes || "",
        blacklistContactsFileUrl: blacklist.emails?.fileUrl || "",
        blacklistContactsNotes: blacklist.emails?.notes || "",
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
      
      // Définir l'onglet actif pour les contacts blacklist
      if (emails?.notes && !emails.fileUrl) {
        setBlacklistContactsTab("notes");
      }
    }
  }, [editMode, initialData]);
  
  // Update form values when initialData changes
  useEffect(() => {
    if (editMode && initialData) {
      form.reset(getInitialValues());
    }
  }, [initialData, editMode, form]);

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
        tool: data.tool,
        targeting: {
          jobTitles: data.jobTitles ? data.jobTitles.split(",").map(item => item.trim()) : [],
          industries: data.industries ? data.industries.split(",").map(item => item.trim()) : [],
          locations: data.locations ? data.locations.split(",").map(item => item.trim()) : [],
          companySize: data.companySize ? data.companySize.split(",").map(item => item.trim()) : [],
          otherCriteria: data.otherCriteria || ""
        },
        blacklist: {
          accounts: {
            fileUrl: data.blacklistAccountsFileUrl || "",
            notes: data.blacklistAccountsNotes || ""
          },
          emails: {
            fileUrl: data.blacklistContactsFileUrl || "",
            notes: data.blacklistContactsNotes || ""
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
          tool: data.tool,
          targeting: requestData.targeting,
          blacklist: requestData.blacklist
        });
        
        if (result) {
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
        // Mode création - Créer une nouvelle demande
        console.log("Création de la demande avec:", requestData);
        const newRequest = await createDatabaseRequest(requestData);
        
        if (newRequest) {
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
      // Afficher plus de détails sur l'erreur
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur inconnue lors de la création/modification de la demande";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (field: string, files: FileList | null) => {
    try {
      if (files && files.length > 0) {
        const file = files[0];
        // Simuler un téléchargement réussi
        const fakeUrl = `uploads/${file.name}`;
        form.setValue(field as any, fakeUrl);
      } else {
        form.setValue(field as any, "");
      }
    } finally {
      // Pas besoin de setTimeout ici car c'est une simulation
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormHeader control={form.control} user={user} editMode={editMode} />
        <TargetingSection control={form.control} />
        <BlacklistSection 
          control={form.control} 
          blacklistAccountsTab={blacklistAccountsTab}
          setBlacklistAccountsTab={setBlacklistAccountsTab}
          blacklistContactsTab={blacklistContactsTab}
          setBlacklistContactsTab={setBlacklistContactsTab}
          handleFileUpload={handleFileUpload}
        />
        <FormFooter submitting={submitting} editMode={editMode} />
      </form>
    </Form>
  );
};
