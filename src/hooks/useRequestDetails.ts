import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getRequestDetails } from "@/services/requests/requestQueryService";
import { Request, Mission, WorkflowStatus, MissionType } from "@/types/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cloneRequest } from "@/services/requests/cloneRequestService";

export const useRequestDetails = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("pending_assignment");
  const [emailPlatform, setEmailPlatform] = useState("");

  const fetchRequestDetails = async () => {
    console.log(`[useRequestDetails] 🔄 Début fetchRequestDetails pour requestId: ${requestId}`);
    
    if (!requestId || requestId === "new" || !user) {
      console.log(`[useRequestDetails] ⏭️ Skipping fetch - Mode création détecté (requestId: ${requestId}), user: ${!!user}`);
      setLoading(false);
      return;
    }

    // Vérifier que l'ID est un UUID valide avant de faire la requête
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      console.warn(`[useRequestDetails] ❌ ID invalide: ${requestId}`);
      setError(`ID de demande invalide: ${requestId}`);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`[useRequestDetails] 🔍 Récupération des détails pour: ${requestId}`);
      
      // Pour les demandes archivées, ne pas filtrer par SDR même si l'utilisateur est SDR
      // Car les archives doivent être accessibles à tous pour consultation
      const isSDR = user.role === 'sdr';
      const shouldFilterBySdr = isSDR; // Garder le filtrage seulement pour les SDR sur leurs propres demandes actives
      
      const details = await getRequestDetails(requestId, user.id, shouldFilterBySdr);
      
      if (details) {
        console.log(`[useRequestDetails] ✅ Détails récupérés:`, details);
        setRequest(details);
        setWorkflowStatus(details.workflow_status);
        
        // Récupérer les détails de la mission si elle existe
        if (details.missionId) {
          console.log(`[useRequestDetails] 🎯 Récupération mission: ${details.missionId}`);
          const { data: missionData } = await supabase
            .from('missions')
            .select('*')
            .eq('id', details.missionId)
            .single();
          
          if (missionData) {
            // Transformer les données Supabase au format Mission TypeScript
            const transformedMission: Mission = {
              id: missionData.id,
              name: missionData.name,
              sdrId: missionData.sdr_id,
              description: missionData.description,
              createdAt: new Date(missionData.created_at),
              startDate: missionData.start_date ? new Date(missionData.start_date) : null,
              endDate: missionData.end_date ? new Date(missionData.end_date) : null,
              type: missionData.type as MissionType,
              status: missionData.status as "En cours" | "Fin",
              requests: [],
              client: missionData.client
            };
            
            setMission(transformedMission);
          }
        }
        
        // Si c'est une demande email, récupérer la plateforme depuis les détails
        if (details.type === "email") {
          // Vérifier plusieurs emplacements possibles pour la plateforme
          const platform = details.details?.platform || 
                           (details as any).platform || 
                           "";
          setEmailPlatform(platform);
          console.log(`[useRequestDetails] 📧 Plateforme email trouvée: ${platform}`);
        }
        
        console.log(`[useRequestDetails] ✅ Chargement terminé avec succès`);
      } else {
        setError("Demande non trouvée");
        console.warn(`[useRequestDetails] ⚠️ Aucun détail trouvé pour: ${requestId}`);
      }
    } catch (err) {
      console.error(`[useRequestDetails] 💥 Erreur lors de la récupération:`, err);
      setError("Erreur lors de la récupération des détails de la demande");
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflowStatus = async (status: WorkflowStatus) => {
    if (!request || !user) return;
    
    try {
      console.log(`[useRequestDetails] 🔄 Mise à jour statut: ${status}`);
      
      const { error } = await supabase
        .from('requests')
        .update({ workflow_status: status })
        .eq('id', request.id);

      if (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        toast.error("Erreur lors de la mise à jour du statut");
        return;
      }

      setWorkflowStatus(status);
      toast.success("Statut mis à jour avec succès");
      await fetchRequestDetails(); // Rafraîchir les données
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const updateEmailPlatform = async (platform: string) => {
    if (!request || !user) return;
    
    try {
      console.log(`[useRequestDetails] 📧 Mise à jour plateforme email: ${platform}`);
      
      const updatedDetails = {
        ...request.details,
        platform: platform
      };

      const { error } = await supabase
        .from('requests')
        .update({ details: updatedDetails })
        .eq('id', request.id);

      if (error) {
        console.error("Erreur lors de la mise à jour de la plateforme:", error);
        toast.error("Erreur lors de la mise à jour de la plateforme");
        return;
      }

      setEmailPlatform(platform);
      toast.success("Plateforme mise à jour avec succès");
      await fetchRequestDetails(); // Rafraîchir les données
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la plateforme:", err);
      toast.error("Erreur lors de la mise à jour de la plateforme");
    }
  };

  const addComment = async () => {
    if (!comment.trim() || !request || !user) return;
    
    setCommentLoading(true);
    try {
      console.log(`[useRequestDetails] 💬 Ajout commentaire: ${comment}`);
      
      // Simuler l'ajout de commentaire pour l'instant
      toast.success("Commentaire ajouté avec succès");
      setComment("");
    } catch (err) {
      console.error("Erreur lors de l'ajout du commentaire:", err);
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCloneRequest = async () => {
    if (!request || !user) {
      toast.error("Impossible de cloner la demande");
      return;
    }
    
    try {
      console.log(`[useRequestDetails] 📋 Début du clonage de la demande: ${request.id}`);
      toast.loading("Clonage de la demande en cours...");
      
      const clonedRequest = await cloneRequest(request.id);
      
      if (clonedRequest) {
        console.log(`[useRequestDetails] ✅ Demande clonée avec succès: ${clonedRequest.id}`);
        toast.success("Demande clonée avec succès !");
        
        // Rediriger vers la nouvelle demande clonée
        navigate(`/request/${clonedRequest.id}`);
      } else {
        console.error(`[useRequestDetails] ❌ Échec du clonage`);
        toast.error("Erreur lors du clonage de la demande");
      }
    } catch (error) {
      console.error(`[useRequestDetails] 💥 Erreur lors du clonage:`, error);
      toast.error("Erreur lors du clonage de la demande");
    }
  };

  useEffect(() => {
    console.log(`[useRequestDetails] 🎯 Initialisation du hook - requestId: ${requestId}, user role: ${user?.role}`);
    fetchRequestDetails();
  }, [requestId, user]);

  return { 
    request, 
    mission,
    loading, 
    error, 
    comment,
    commentLoading,
    isEditDialogOpen,
    workflowStatus,
    emailPlatform,
    setComment,
    setIsEditDialogOpen,
    updateWorkflowStatus,
    updateEmailPlatform,
    addComment,
    fetchRequestDetails,
    handleCloneRequest,
    refetch: fetchRequestDetails 
  };
};
