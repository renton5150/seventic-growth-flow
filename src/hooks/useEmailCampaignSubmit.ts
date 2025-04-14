
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

interface SubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Custom hook to handle submission logic for email campaign form
 * 
 * @param {Object} params - Parameters for the hook
 * @param {boolean} params.editMode - Whether the form is in edit mode
 * @param {string} params.initialDataId - ID of the campaign being edited (required if editMode is true)
 * @param {boolean} params.fileUploading - Whether files are currently being uploaded
 * @returns {Object} - Submission state and handler function
 */
export const useEmailCampaignSubmit = ({ 
  editMode = false, 
  initialDataId,
  fileUploading 
}: UseEmailCampaignSubmitProps) => {
  const [submitting, setSubmitting] = useState(false);

  /**
   * Handles form submission for creating or updating email campaigns
   * 
   * @param {FormData} data - Form data from the email campaign form
   * @param {User|null} user - Current authenticated user
   * @param {Function} navigate - Navigation function to redirect after submission
   * @returns {Promise<SubmissionResult|null>} - Result of the submission
   */
  const handleSubmit = async (
    data: FormData, 
    user: User | null, 
    navigate: (path: string) => void
  ): Promise<SubmissionResult | null> => {
    // Validation checks before submission
    if (fileUploading) {
      toast.error("Veuillez attendre la fin du téléchargement des fichiers");
      return null;
    }

    if (!user) {
      toast.error("Vous devez être connecté pour créer une requête");
      return null;
    }
    
    // In edit mode, verify we have the required ID
    if (editMode && !initialDataId) {
      toast.error("ID de campagne manquant pour la mise à jour");
      return null;
    }

    setSubmitting(true);
    
    try {
      console.log("Données soumises:", data);
      
      // Parse date string to Date object
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
      
      if (editMode && initialDataId) {
        // Update existing request
        console.log(`Updating request ${initialDataId}:`, requestData);
        
        const result = await updateRequest(initialDataId, {
          title: data.title,
          dueDate: dueDate,
          template: requestData.template,
          database: requestData.database,
          blacklist: requestData.blacklist
        });
        
        if (result) {
          console.log("Request updated:", result);
          toast.success("Demande de campagne email mise à jour avec succès");
          navigate(`/requests/email/${initialDataId}`);
          return { success: true, data: result };
        } 
        
        throw new Error("Erreur lors de la mise à jour de la demande");
      } else {
        // Create new request
        console.log("Creating new request:", requestData);
        
        const newRequest = await createEmailCampaignRequest(requestData);
        
        if (newRequest) {
          console.log("New request created:", newRequest);
          toast.success("Demande de campagne email créée avec succès");
          navigate("/dashboard");
          return { success: true, data: newRequest };
        }
        
        throw new Error("Erreur lors de la création de la demande");
      }
    } catch (error) {
      // Enhanced error handling
      console.error("Error during submission:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur inconnue lors de la création/modification de la demande";
      
      toast.error(`Erreur: ${errorMessage}`);
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    handleSubmit
  };
};
