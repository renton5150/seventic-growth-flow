
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, PenSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Request, Mission, EmailCampaignRequest, DatabaseRequest, LinkedInScrapingRequest } from "@/types/types";
import { RequestCompleteEditDialog } from "@/components/request-details/RequestCompleteEditDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { GrowthRequestStatusBadge } from "@/components/growth/table/GrowthRequestStatusBadge";
import { formatRequestFromDb } from "@/utils/requestFormatters";
import { EmailCampaignDetails } from "@/components/request-details/EmailCampaignDetails";
import { DatabaseDetails } from "@/components/request-details/DatabaseDetails";
import { LinkedInDetails } from "@/components/request-details/LinkedInDetails";
import { RequestComments } from "@/components/request-details/RequestComments";
import { RequestInfo } from "@/components/request-details/RequestInfo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function isEmailRequest(request: Request): request is EmailCampaignRequest {
  return request.type === "email";
}

function isDatabaseRequest(request: Request): request is DatabaseRequest {
  return request.type === "database";
}

function isLinkedInRequest(request: Request): request is LinkedInScrapingRequest {
  return request.type === "linkedin";
}

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
  const [workflowStatus, setWorkflowStatus] = useState<string>("");
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
        setWorkflowStatus(formattedRequest.workflow_status || "pending_assignment");
        
        // Récupérer la plateforme d'emailing si elle existe dans les détails
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

  const updateWorkflowStatus = async (status: string) => {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{request?.title}</h1>
          </div>
          
          {canEdit && (
            <Button 
              variant="default"
              onClick={() => setIsEditDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <PenSquare className="h-4 w-4" />
              Modifier la demande
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Badge className="px-2 py-1">
            {request?.type === "email"
              ? "Campagne Email"
              : request?.type === "database"
              ? "Base de données"
              : "Scraping LinkedIn"}
          </Badge>
          {request && (
            <GrowthRequestStatusBadge 
              status={request.workflow_status || "pending_assignment"} 
              isLate={request.isLate}
            />
          )}
        </div>

        {/* Contrôles pour Growth et Admin */}
        {isGrowthOrAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            <div>
              <p className="text-sm font-medium mb-1">Statut de la demande</p>
              <Select
                value={workflowStatus}
                onValueChange={(value) => {
                  setWorkflowStatus(value);
                  updateWorkflowStatus(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_assignment">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="canceled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isEmailRequest(request) && (
              <div>
                <p className="text-sm font-medium mb-1">Plateforme d'emailing</p>
                <Select
                  value={emailPlatform}
                  onValueChange={(value) => {
                    setEmailPlatform(value);
                    updateEmailPlatform(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une plateforme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acelmail">Acelmail</SelectItem>
                    <SelectItem value="Brevo">Brevo</SelectItem>
                    <SelectItem value="Mindbaz">Mindbaz</SelectItem>
                    <SelectItem value="Mailjet">Mailjet</SelectItem>
                    <SelectItem value="Postyman">Postyman</SelectItem>
                    <SelectItem value="Mailwizz">Mailwizz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="comments">Commentaires</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                {isEmailRequest(request) && <EmailCampaignDetails request={request} />}
                {isDatabaseRequest(request) && <DatabaseDetails request={request} />}
                {isLinkedInRequest(request) && <LinkedInDetails request={request} />}
              </TabsContent>
              
              <TabsContent value="comments">
                <RequestComments
                  comments={request.details?.comments || []}
                  comment={comment}
                  commentLoading={commentLoading}
                  onCommentChange={setComment}
                  onAddComment={addComment}
                />
              </TabsContent>
            </Tabs>
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
            onRequestUpdated={() => {
              fetchRequestDetails();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default RequestDetails;
