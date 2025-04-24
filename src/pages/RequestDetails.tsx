
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Request, WorkflowStatus, Mission } from "@/types/types";
import { RequestCompleteEditDialog } from "@/components/request-details/RequestCompleteEditDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { RequestHeader } from "@/components/request-details/RequestHeader";
import { RequestStatusControls } from "@/components/request-details/RequestStatusControls";
import { RequestTabs } from "@/components/request-details/RequestTabs";
import { RequestInfo } from "@/components/request-details/RequestInfo";

const RequestDetails = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user, isGrowth } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("pending_assignment");
  const [emailPlatform, setEmailPlatform] = useState<string>("");
  const isGrowthOrAdmin = user?.role === 'growth' || user?.role === 'admin';

  const fetchRequestDetails = async () => {
    if (id) {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('requests_with_missions')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error("Erreur lors de la récupération des détails de la demande:", error);
          toast.error("Erreur lors de la récupération des détails de la demande");
          navigate(-1);
          return;
        }
        
        console.log("Données brutes de la requête récupérée:", data);
        
        const formattedRequest = formatRequestFromDb(data);
        setRequest(formattedRequest);
        
        if (formattedRequest.workflow_status) {
          setWorkflowStatus(formattedRequest.workflow_status as WorkflowStatus);
        }
        
        if (formattedRequest.type === "email" && formattedRequest.details) {
          setEmailPlatform(formattedRequest.details.emailPlatform || "");
        }
        
        if (data.mission_id) {
          const missionName = data.mission_name || "Mission sans nom";
          
          setMission({
            id: data.mission_id,
            name: missionName,
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
        user: user?.name || "Utilisateur",
        timestamp: new Date().toISOString(),
        userId: user?.id
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Chargement des détails de la demande...</p>
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Cette demande n'existe pas</p>
        </div>
      </AppLayout>
    );
  }

  const canEdit = user?.role === "admin" || user?.id === request.createdBy || user?.role === "growth";

  return (
    <AppLayout>
      <div className="space-y-6">
        <RequestHeader
          request={request}
          onBack={() => navigate(-1)}
          onEdit={() => setIsEditDialogOpen(true)}
          canEdit={canEdit}
        />

        <RequestStatusControls
          isGrowthOrAdmin={isGrowthOrAdmin}
          workflowStatus={workflowStatus}
          onWorkflowStatusChange={(status) => {
            setWorkflowStatus(status);
            updateWorkflowStatus(status);
          }}
          isEmailRequest={request.type === "email"}
          emailPlatform={emailPlatform}
          onEmailPlatformChange={(platform) => {
            setEmailPlatform(platform);
            updateEmailPlatform(platform);
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <RequestTabs
              request={request}
              comment={comment}
              commentLoading={commentLoading}
              onCommentChange={setComment}
              onAddComment={addComment}
            />
          </div>

          <div>
            <RequestInfo request={request} mission={mission} />
          </div>
        </div>

        {request && (
          <RequestCompleteEditDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            request={request}
            onRequestUpdated={fetchRequestDetails}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default RequestDetails;
