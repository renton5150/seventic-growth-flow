import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Request, Mission, WorkflowStatus } from "@/types/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { syncKnownMissions, getMissionName, preloadMissionNames } from "@/services/missionNameService";
import { cloneRequest } from "@/services/requests/cloneRequestService";

export const useRequestDetails = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("pending_assignment");
  const [emailPlatform, setEmailPlatform] = useState<string>("");
  const [isCloning, setIsCloning] = useState(false);

  // Synchroniser les missions connues au chargement
  useEffect(() => {
    syncKnownMissions().then(() => {
      console.log("[useRequestDetails] Missions connues synchronisées");
    });
  }, []);

  const fetchRequestDetails = async () => {
    if (id) {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('requests_with_missions')
          .select('*', { count: 'exact' })
          .eq('id', id)
          .single();
          
        if (error) {
          console.error("Erreur lors de la récupération des détails de la demande:", error);
          toast.error("Erreur lors de la récupération des détails de la demande");
          navigate(-1);
          return;
        }
        
        console.log("[useRequestDetails] Données brutes de la requête récupérée:", data);
        
        // Attendre la résolution de la promesse retournée par formatRequestFromDb
        const formattedRequest = await formatRequestFromDb(data);
        console.log("[useRequestDetails] Demande formatée:", formattedRequest);
        setRequest(formattedRequest);
        
        if (formattedRequest.workflow_status) {
          setWorkflowStatus(formattedRequest.workflow_status as WorkflowStatus);
        }
        
        if (formattedRequest.type === "email" && formattedRequest.details) {
          setEmailPlatform(formattedRequest.details.emailPlatform || "");
        }
        
        if (data.mission_id) {
          // Utiliser getMissionName pour obtenir le nom correct de la mission
          const missionName = await getMissionName(data.mission_id, {
            fallbackClient: data.mission_client,
            fallbackName: data.mission_name
          });
          
          console.log(`[useRequestDetails] Nom de mission récupéré pour ${data.mission_id}: "${missionName}"`);
          
          setMission({
            id: data.mission_id,
            name: missionName, // Utiliser le nom standardisé
            description: data.mission_client ? `Client: ${data.mission_client}` : "",
            sdrId: data.created_by,
            sdrName: data.sdr_name,
            createdAt: new Date(data.created_at),
            startDate: null,
            endDate: null,
            type: "Full",
            status: "En cours",
            requests: []
          });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des détails de la demande:", error);
        toast.error("Erreur lors de la récupération des détails de la demande");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id, navigate]);

  const updateWorkflowStatus = async (status: WorkflowStatus) => {
    if (!request) return;
    
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          workflow_status: status,
          last_updated: new Date().toISOString()
        })
        .eq('id', request.id);
      
      if (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        toast.error("Erreur lors de la mise à jour du statut");
        return;
      }
      
      setRequest({
        ...request,
        workflow_status: status,
        lastUpdated: new Date()
      });
      
      toast.success(`Statut mis à jour: ${
        status === "pending_assignment" ? "En attente" :
        status === "in_progress" ? "En cours" :
        status === "completed" ? "Terminée" :
        "Annulée"
      }`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const updateEmailPlatform = async (platform: string) => {
    if (!request || request.type !== "email") return;
    
    try {
      const currentDetails = request.details || {};
      
      const { error } = await supabase
        .from('requests')
        .update({
          details: {
            ...currentDetails,
            emailPlatform: platform
          },
          last_updated: new Date().toISOString()
        })
        .eq('id', request.id);
      
      if (error) {
        console.error("Erreur lors de la mise à jour de la plateforme d'emailing:", error);
        toast.error("Erreur lors de la mise à jour de la plateforme d'emailing");
        return;
      }
      
      setRequest({
        ...request,
        details: {
          ...request.details,
          emailPlatform: platform
        },
        lastUpdated: new Date()
      });
      
      toast.success(`Plateforme d'emailing mise à jour: ${platform}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la plateforme d'emailing:", error);
      toast.error("Erreur lors de la mise à jour de la plateforme d'emailing");
    }
  };

  const addComment = async () => {
    if (!comment.trim() || !request) return;

    try {
      setCommentLoading(true);
      
      const currentDetails = request.details || {};
      const currentComments = currentDetails.comments || [];
      
      const newComment = {
        id: Date.now().toString(),
        text: comment,
        user: request.sdrName || "Utilisateur",
        timestamp: new Date().toISOString(),
        userId: request.createdBy
      };
      
      const newComments = [...currentComments, newComment];
      
      const { error } = await supabase
        .from('requests')
        .update({
          details: {
            ...currentDetails,
            comments: newComments
          },
          last_updated: new Date().toISOString()
        })
        .eq('id', request.id);
      
      if (error) {
        console.error("Erreur lors de l'ajout du commentaire:", error);
        toast.error("Erreur lors de l'ajout du commentaire");
        return;
      }
      
      setRequest({
        ...request,
        details: {
          ...request.details,
          comments: newComments
        },
        lastUpdated: new Date()
      });
      
      setComment("");
      toast.success("Commentaire ajouté avec succès");
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setCommentLoading(false);
    }
  };

  /**
   * Fonction pour cloner la demande actuelle
   */
  const handleCloneRequest = async () => {
    if (!request || !request.id || isCloning) return;
    
    try {
      setIsCloning(true);
      toast.loading("Clonage de la demande en cours...");
      
      const clonedRequest = await cloneRequest(request.id);
      
      if (clonedRequest) {
        toast.dismiss();
        toast.success("Demande clonée avec succès");
        
        // Rediriger vers la nouvelle demande
        navigate(`/request/${clonedRequest.type}/${clonedRequest.id}`);
      } else {
        toast.dismiss();
        toast.error("Erreur lors du clonage de la demande");
      }
    } catch (error) {
      console.error("Erreur lors du clonage de la demande:", error);
      toast.dismiss();
      toast.error("Erreur lors du clonage de la demande");
    } finally {
      setIsCloning(false);
    }
  };

  return {
    request,
    mission,
    loading,
    comment,
    commentLoading,
    isEditDialogOpen,
    workflowStatus,
    emailPlatform,
    isCloning,
    setComment,
    setIsEditDialogOpen,
    updateWorkflowStatus,
    updateEmailPlatform,
    addComment,
    fetchRequestDetails,
    handleCloneRequest,
  };
};
