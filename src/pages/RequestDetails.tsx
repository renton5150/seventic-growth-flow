
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, Users, Clock, Check, AlertCircle, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Request, Mission } from "@/types/types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { GrowthRequestStatusBadge } from "@/components/growth/table/GrowthRequestStatusBadge";

const RequestDetails = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (id) {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('requests')
            .select(`
              *,
              profiles:created_by(name, avatar),
              assigned_profile:assigned_to(name, avatar),
              missions:mission_id(name, description)
            `)
            .eq('id', id)
            .single();
            
          if (error) {
            console.error("Erreur lors de la récupération des détails de la demande:", error);
            toast.error("Erreur lors de la récupération des détails de la demande");
            navigate(-1);
            return;
          }
          
          // Formater la demande
          const formattedRequest = {
            ...data,
            id: data.id,
            title: data.title,
            type: data.type,
            missionId: data.mission_id,
            missionName: data.missions?.name,
            createdBy: data.created_by,
            sdrName: data.profiles?.name || "Non assigné",
            createdAt: new Date(data.created_at),
            dueDate: new Date(data.due_date),
            status: data.status,
            workflow_status: data.workflow_status || 'pending_assignment',
            target_role: data.target_role || 'growth',
            assigned_to: data.assigned_to,
            assignedToName: data.assigned_profile?.name,
            lastUpdated: new Date(data.last_updated || data.created_at),
            isLate: new Date(data.due_date) < new Date() && 
                    (data.workflow_status !== 'completed' && data.workflow_status !== 'canceled'),
            ...data.details
          };

          setRequest(formattedRequest);
          
          // Récupérer les détails de la mission associée si besoin
          if (data.missions) {
            setMission({
              id: data.mission_id,
              name: data.missions.name,
              description: data.missions.description,
              sdrId: data.created_by,
              sdrName: data.profiles?.name,
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

    fetchRequestDetails();
  }, [id, navigate]);

  const addComment = async () => {
    if (!comment.trim() || !request) return;

    try {
      setCommentLoading(true);
      
      // Récupérer les commentaires existants ou créer un tableau vide
      const currentDetails = request?.details || {};
      const currentComments = currentDetails.comments || [];
      
      // Ajouter le nouveau commentaire
      const newComment = {
        id: Date.now().toString(),
        text: comment,
        user: user?.name || "Utilisateur",
        timestamp: new Date().toISOString(),
        userId: user?.id
      };
      
      const newComments = [...currentComments, newComment];
      
      // Mettre à jour la demande avec le nouveau commentaire
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
      
      // Mettre à jour l'interface utilisateur
      setRequest({
        ...request,
        details: {
          ...currentDetails,
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

  const renderEmailCampaignDetails = () => {
    if (!request) return null;

    // Accéder aux champs spécifiques à une campagne email
    const template = request.template || {};
    const database = request.database || {};
    const blacklist = request.blacklist || {};

    return (
      <>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Template Email</CardTitle>
          </CardHeader>
          <CardContent>
            {template.content && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Contenu</h4>
                <div className="p-4 border rounded-md bg-gray-50 mt-1" dangerouslySetInnerHTML={{ __html: template.content }} />
              </div>
            )}
            {template.webLink && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Lien web</h4>
                <a href={template.webLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  {template.webLink}
                </a>
              </div>
            )}
            {template.fileUrl && (
              <div>
                <h4 className="font-semibold text-sm">Fichier attaché</h4>
                <a href={template.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  Télécharger le fichier
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Base de données</CardTitle>
          </CardHeader>
          <CardContent>
            {database.notes && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Notes</h4>
                <p>{database.notes}</p>
              </div>
            )}
            {database.fileUrl && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Fichier</h4>
                <a href={database.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  Télécharger la base de données
                </a>
              </div>
            )}
            {database.webLink && (
              <div>
                <h4 className="font-semibold text-sm">Lien web</h4>
                <a href={database.webLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  {database.webLink}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {blacklist && (blacklist.accounts || blacklist.emails) && (
          <Card>
            <CardHeader>
              <CardTitle>Liste noire</CardTitle>
            </CardHeader>
            <CardContent>
              {blacklist.accounts && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Comptes exclus</h4>
                  <p>{blacklist.accounts.notes}</p>
                  {blacklist.accounts.fileUrl && (
                    <a href={blacklist.accounts.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      Télécharger la liste de comptes
                    </a>
                  )}
                </div>
              )}
              {blacklist.emails && (
                <div>
                  <h4 className="font-semibold text-sm">Emails exclus</h4>
                  <p>{blacklist.emails.notes}</p>
                  {blacklist.emails.fileUrl && (
                    <a href={blacklist.emails.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      Télécharger la liste d'emails
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  const renderDatabaseDetails = () => {
    if (!request) return null;

    // Accéder aux champs spécifiques à une base de données
    const tool = request.tool || "";
    const targeting = request.targeting || {};
    const blacklist = request.blacklist || {};
    const contactsCreated = request.contactsCreated || 0;

    return (
      <>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
          </CardHeader>
          <CardContent>
            {tool && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Outil utilisé</h4>
                <p>{tool}</p>
              </div>
            )}
            {contactsCreated > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Contacts créés</h4>
                <p>{contactsCreated}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {targeting && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Critères de ciblage</CardTitle>
            </CardHeader>
            <CardContent>
              {targeting.jobTitles && targeting.jobTitles.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Titres de poste</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {targeting.jobTitles.map((title: string, index: number) => (
                      <Badge key={index} variant="outline">{title}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {targeting.industries && targeting.industries.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Industries</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {targeting.industries.map((industry: string, index: number) => (
                      <Badge key={index} variant="outline">{industry}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {targeting.locations && targeting.locations.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Localisations</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {targeting.locations.map((location: string, index: number) => (
                      <Badge key={index} variant="outline">{location}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {targeting.companySize && targeting.companySize.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Taille d'entreprise</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {targeting.companySize.map((size: string, index: number) => (
                      <Badge key={index} variant="outline">{size}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {targeting.otherCriteria && (
                <div>
                  <h4 className="font-semibold text-sm">Autres critères</h4>
                  <p>{targeting.otherCriteria}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {blacklist && blacklist.accounts && (
          <Card>
            <CardHeader>
              <CardTitle>Liste noire</CardTitle>
            </CardHeader>
            <CardContent>
              {blacklist.accounts.notes && (
                <p>{blacklist.accounts.notes}</p>
              )}
              {blacklist.accounts.fileUrl && (
                <a href={blacklist.accounts.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  Télécharger la liste d'exclusions
                </a>
              )}
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  const renderLinkedInDetails = () => {
    if (!request) return null;

    // Accéder aux champs spécifiques au scraping LinkedIn
    const targeting = request.targeting || {};
    const profilesScraped = request.profilesScraped || 0;
    const resultFileUrl = request.resultFileUrl || "";

    return (
      <>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
          </CardHeader>
          <CardContent>
            {profilesScraped > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Profils récupérés</h4>
                <p>{profilesScraped}</p>
              </div>
            )}
            {resultFileUrl && (
              <div>
                <h4 className="font-semibold text-sm">Fichier de résultats</h4>
                <a href={resultFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  Télécharger les résultats
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {targeting && (
          <Card>
            <CardHeader>
              <CardTitle>Critères de ciblage</CardTitle>
            </CardHeader>
            <CardContent>
              {targeting.jobTitles && targeting.jobTitles.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Titres de poste</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {targeting.jobTitles.map((title: string, index: number) => (
                      <Badge key={index} variant="outline">{title}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {targeting.industries && targeting.industries.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Industries</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {targeting.industries.map((industry: string, index: number) => (
                      <Badge key={index} variant="outline">{industry}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {targeting.locations && targeting.locations.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Localisations</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {targeting.locations.map((location: string, index: number) => (
                      <Badge key={index} variant="outline">{location}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {targeting.companySize && targeting.companySize.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Taille d'entreprise</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {targeting.companySize.map((size: string, index: number) => (
                      <Badge key={index} variant="outline">{size}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {targeting.otherCriteria && (
                <div>
                  <h4 className="font-semibold text-sm">Autres critères</h4>
                  <p>{targeting.otherCriteria}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  const renderComments = () => {
    if (!request || !request.details) return null;

    const comments = request.details.comments || [];

    return (
      <div className="space-y-4">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun commentaire pour le moment
            </div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="p-4 border rounded-md">
                <div className="flex justify-between mb-2">
                  <div className="font-semibold">{comment.user}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(comment.timestamp).toLocaleString()}
                  </div>
                </div>
                <p>{comment.text}</p>
              </div>
            ))
          )}
        </div>
        
        <div className="space-y-2">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button 
            onClick={addComment} 
            disabled={!comment.trim() || commentLoading}
            className="w-full"
          >
            {commentLoading ? "Envoi en cours..." : "Ajouter un commentaire"}
          </Button>
        </div>
      </div>
    );
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{request.title}</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Badge className="px-2 py-1">
            {request.type === "email"
              ? "Campagne Email"
              : request.type === "database"
              ? "Base de données"
              : "Scraping LinkedIn"}
          </Badge>
          <GrowthRequestStatusBadge 
            status={request.workflow_status || "pending_assignment"} 
            isLate={request.isLate}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="comments">Commentaires</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                {request.type === "email" && renderEmailCampaignDetails()}
                {request.type === "database" && renderDatabaseDetails()}
                {request.type === "linkedin" && renderLinkedInDetails()}
              </TabsContent>
              
              <TabsContent value="comments">
                {renderComments()}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Créée le</div>
                    <div>{new Date(request.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Date d'échéance</div>
                    <div>{new Date(request.dueDate).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Dernière mise à jour</div>
                    <div>{new Date(request.lastUpdated).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500">Créée par</div>
                    <div>{request.sdrName || "Inconnu"}</div>
                  </div>
                </div>

                {request.assignedToName && (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-sm text-gray-500">Assignée à</div>
                      <div>{request.assignedToName}</div>
                    </div>
                  </div>
                )}
                
                {request.isLate && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <div>En retard</div>
                  </div>
                )}

                {mission && (
                  <div className="pt-2 border-t">
                    <h3 className="font-medium mb-1">Mission</h3>
                    <p>{mission.name}</p>
                    {mission.description && (
                      <p className="text-sm text-gray-500 mt-1">{mission.description}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RequestDetails;
