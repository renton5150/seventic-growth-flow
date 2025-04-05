
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Database as DatabaseIcon,
  User,
  Calendar,
  FileClock,
  FileCheck,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Request, RequestStatus } from "@/types/types";
import { getRequestById } from "@/services/requestService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RequestDetails = () => {
  const { id, type } = useParams();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (id) {
      const foundRequest = getRequestById(id);
      setRequest(foundRequest);
      setLoading(false);
    }
  }, [id]);

  const renderStatusBadge = (status: RequestStatus, isLate?: boolean) => {
    if (isLate && status === "pending") {
      return (
        <Badge variant="outline" className="bg-status-late text-white flex gap-1 items-center">
          <AlertCircle size={14} /> En retard
        </Badge>
      );
    }

    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-status-pending text-white flex gap-1 items-center">
            <Clock size={14} /> En attente
          </Badge>
        );
      case "inprogress":
        return (
          <Badge variant="outline" className="bg-status-inprogress text-white flex gap-1 items-center">
            <FileClock size={14} /> En cours
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-status-completed text-white flex gap-1 items-center">
            <FileCheck size={14} /> Terminé
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail size={20} className="text-seventic-500" />;
      case "database":
        return <DatabaseIcon size={20} className="text-seventic-500" />;
      case "linkedin":
        return <User size={20} className="text-seventic-500" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "email":
        return "Campagne Email";
      case "database":
        return "Création de Base de données";
      case "linkedin":
        return "Scraping LinkedIn";
      default:
        return type;
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <p>Chargement des détails...</p>
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold">Demande non trouvée</h1>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            <ArrowLeft className="mr-2" size={16} />
            Retour au tableau de bord
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2" size={16} />
              Retour
            </Button>
            <h1 className="text-2xl font-bold">{request.title}</h1>
            {renderStatusBadge(request.status, request.isLate)}
          </div>
          {user?.role === "sdr" && (
            <Button variant="outline" onClick={() => navigate(`/requests/${request.type}/${request.id}/edit`)}>
              <Edit className="mr-2" size={16} />
              Modifier
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                {renderTypeIcon(request.type)}
                <span className="ml-2">
                  {getTypeLabel(request.type)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le:</span>
                <span>{formatDate(request.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date prévue:</span>
                <span>{formatDate(request.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mission:</span>
                <span>Mission {request.missionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut:</span>
                <span>{renderStatusBadge(request.status, request.isLate)}</span>
              </div>
            </CardContent>
          </Card>

          {request.type === "email" && (
            <Tabs defaultValue="template" className="col-span-2">
              <TabsList>
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="database">Base de données</TabsTrigger>
                <TabsTrigger value="blacklist">Liste noire</TabsTrigger>
                {request.status === "completed" && <TabsTrigger value="stats">Statistiques</TabsTrigger>}
              </TabsList>
              <TabsContent value="template" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Template d'email</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {request.template?.content && (
                      <div className="whitespace-pre-wrap border p-4 rounded-md bg-muted">
                        {request.template.content}
                      </div>
                    )}
                    {request.template?.fileUrl && (
                      <div className="mt-2">
                        <a href={request.template.fileUrl} className="text-blue-500 underline" target="_blank" rel="noreferrer">
                          Fichier téléchargé
                        </a>
                      </div>
                    )}
                    {request.template?.webLink && (
                      <div className="mt-2">
                        <a href={request.template.webLink} className="text-blue-500 underline" target="_blank" rel="noreferrer">
                          Lien web: {request.template.webLink}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="database" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations sur la base de données</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {request.database?.fileUrl && (
                      <div>
                        <p className="font-semibold">Fichier:</p>
                        <a href={request.database.fileUrl} className="text-blue-500 underline">
                          Télécharger le fichier
                        </a>
                      </div>
                    )}
                    {request.database?.webLink && (
                      <div className="mt-2">
                        <p className="font-semibold">Lien web:</p>
                        <a href={request.database.webLink} className="text-blue-500 underline">
                          {request.database.webLink}
                        </a>
                      </div>
                    )}
                    {request.database?.notes && (
                      <div className="mt-2">
                        <p className="font-semibold">Notes:</p>
                        <p className="whitespace-pre-wrap">{request.database.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="blacklist" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Liste noire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="font-semibold mb-2">Comptes</h3>
                        {request.blacklist?.accounts?.fileUrl && (
                          <div>
                            <a href={request.blacklist.accounts.fileUrl} className="text-blue-500 underline">
                              Télécharger le fichier
                            </a>
                          </div>
                        )}
                        {request.blacklist?.accounts?.notes && (
                          <div className="mt-2">
                            <p className="whitespace-pre-wrap">{request.blacklist.accounts.notes}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Emails</h3>
                        {request.blacklist?.emails?.fileUrl && (
                          <div>
                            <a href={request.blacklist.emails.fileUrl} className="text-blue-500 underline">
                              Télécharger le fichier
                            </a>
                          </div>
                        )}
                        {request.blacklist?.emails?.notes && (
                          <div className="mt-2">
                            <p className="whitespace-pre-wrap">{request.blacklist.emails.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {request.status === "completed" && (
                <TabsContent value="stats" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistiques de la campagne</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-semibold">Plateforme: {request.platform || "Non spécifiée"}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-muted p-4 rounded-md text-center">
                          <p className="text-2xl font-bold">{request.statistics?.sent || 0}</p>
                          <p className="text-sm text-muted-foreground">Envoyés</p>
                        </div>
                        <div className="bg-muted p-4 rounded-md text-center">
                          <p className="text-2xl font-bold">{request.statistics?.opened || 0}</p>
                          <p className="text-sm text-muted-foreground">Ouverts</p>
                        </div>
                        <div className="bg-muted p-4 rounded-md text-center">
                          <p className="text-2xl font-bold">{request.statistics?.clicked || 0}</p>
                          <p className="text-sm text-muted-foreground">Cliqués</p>
                        </div>
                        <div className="bg-muted p-4 rounded-md text-center">
                          <p className="text-2xl font-bold">{request.statistics?.bounced || 0}</p>
                          <p className="text-sm text-muted-foreground">Rebonds</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}

          {request.type === "database" && (
            <Tabs defaultValue="targeting" className="col-span-2">
              <TabsList>
                <TabsTrigger value="targeting">Ciblage</TabsTrigger>
                <TabsTrigger value="blacklist">Liste noire</TabsTrigger>
                {request.status === "completed" && <TabsTrigger value="results">Résultats</TabsTrigger>}
              </TabsList>
              <TabsContent value="targeting" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Critères de ciblage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold">Outil: {request.tool || "Non spécifié"}</p>
                      </div>
                      {request.targeting?.jobTitles && request.targeting.jobTitles.length > 0 && (
                        <div>
                          <p className="font-semibold">Titres de poste:</p>
                          <ul className="list-disc list-inside">
                            {request.targeting.jobTitles.map((title, index) => (
                              <li key={index}>{title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {request.targeting?.industries && request.targeting.industries.length > 0 && (
                        <div>
                          <p className="font-semibold">Industries:</p>
                          <ul className="list-disc list-inside">
                            {request.targeting.industries.map((industry, index) => (
                              <li key={index}>{industry}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {request.targeting?.companySize && request.targeting.companySize.length > 0 && (
                        <div>
                          <p className="font-semibold">Taille d'entreprise:</p>
                          <ul className="list-disc list-inside">
                            {request.targeting.companySize.map((size, index) => (
                              <li key={index}>{size}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {request.targeting?.otherCriteria && (
                        <div>
                          <p className="font-semibold">Autres critères:</p>
                          <p className="whitespace-pre-wrap">{request.targeting.otherCriteria}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="blacklist" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Liste noire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="font-semibold mb-2">Comptes</h3>
                        {request.blacklist?.accounts?.fileUrl && (
                          <div>
                            <a href={request.blacklist.accounts.fileUrl} className="text-blue-500 underline">
                              Télécharger le fichier
                            </a>
                          </div>
                        )}
                        {request.blacklist?.accounts?.notes && (
                          <div className="mt-2">
                            <p className="whitespace-pre-wrap">{request.blacklist.accounts.notes}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Contacts</h3>
                        {request.blacklist?.contacts?.fileUrl && (
                          <div>
                            <a href={request.blacklist.contacts.fileUrl} className="text-blue-500 underline">
                              Télécharger le fichier
                            </a>
                          </div>
                        )}
                        {request.blacklist?.contacts?.notes && (
                          <div className="mt-2">
                            <p className="whitespace-pre-wrap">{request.blacklist.contacts.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {request.status === "completed" && (
                <TabsContent value="results" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Résultats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-md text-center">
                        <p className="text-2xl font-bold">{request.contactsCreated || 0}</p>
                        <p className="text-sm text-muted-foreground">Contacts créés</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}

          {request.type === "linkedin" && (
            <Tabs defaultValue="targeting" className="col-span-2">
              <TabsList>
                <TabsTrigger value="targeting">Ciblage</TabsTrigger>
                {request.status === "completed" && <TabsTrigger value="results">Résultats</TabsTrigger>}
              </TabsList>
              <TabsContent value="targeting" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Critères de ciblage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {request.targeting?.jobTitles && request.targeting.jobTitles.length > 0 && (
                        <div>
                          <p className="font-semibold">Titres de poste:</p>
                          <ul className="list-disc list-inside">
                            {request.targeting.jobTitles.map((title, index) => (
                              <li key={index}>{title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {request.targeting?.locations && request.targeting.locations.length > 0 && (
                        <div>
                          <p className="font-semibold">Localisations:</p>
                          <ul className="list-disc list-inside">
                            {request.targeting.locations.map((location, index) => (
                              <li key={index}>{location}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {request.targeting?.industries && request.targeting.industries.length > 0 && (
                        <div>
                          <p className="font-semibold">Industries:</p>
                          <ul className="list-disc list-inside">
                            {request.targeting.industries.map((industry, index) => (
                              <li key={index}>{industry}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {request.targeting?.companySize && request.targeting.companySize.length > 0 && (
                        <div>
                          <p className="font-semibold">Taille d'entreprise:</p>
                          <ul className="list-disc list-inside">
                            {request.targeting.companySize.map((size, index) => (
                              <li key={index}>{size}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {request.targeting?.otherCriteria && (
                        <div>
                          <p className="font-semibold">Autres critères:</p>
                          <p className="whitespace-pre-wrap">{request.targeting.otherCriteria}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {request.status === "completed" && (
                <TabsContent value="results" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Résultats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-md text-center mb-4">
                        <p className="text-2xl font-bold">{request.profilesScraped || 0}</p>
                        <p className="text-sm text-muted-foreground">Profils récupérés</p>
                      </div>
                      {request.resultFileUrl && (
                        <div>
                          <a href={request.resultFileUrl} className="text-blue-500 underline" download>
                            Télécharger les résultats
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default RequestDetails;
