
import { useState } from "react";
import { FormData } from "@/components/requests/email-campaign/schema";
import { createEmailCampaignRequest, updateRequest } from "@/services/requestService";
import { toast } from "sonner";
import { User } from "@/types/types";

interface UseEmailCampaignSubmitProps {
  editMode?: boolean;
  initialDataId?: string;
  fileUploading: boolean;
}

export const useEmailCampaignSubmit = ({ 
  editMode = false, 
  initialDataId,
  fileUploading 
}: UseEmailCampaignSubmitProps) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: FormData, user: User | null, navigate: (path: string) => void) => {
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
        dueDate: dueDate
      };
      
      let result;
      
      if (editMode && initialDataId) {
        // Mode édition - Mettre à jour la demande existante
        console.log("Mise à jour de la demande avec:", requestData);
        result = await updateRequest(initialDataId, {
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
          navigate("/requests/email/" + initialDataId);
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
      
      return result;
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      // Afficher plus de détails sur l'erreur
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur inconnue lors de la création/modification de la demande";
      toast.error(`Erreur: ${errorMessage}`);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    handleSubmit
  };
};
