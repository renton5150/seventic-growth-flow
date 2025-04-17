
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { useGrowthDashboard } from "@/hooks/useGrowthDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GrowthRequestStatusBadge } from "@/components/growth/table/GrowthRequestStatusBadge";
import { GrowthRequestTypeIcon } from "@/components/growth/table/GrowthRequestTypeIcon";
import { Badge } from "@/components/ui/badge";
import { RequestEditDialog } from "@/components/growth/RequestEditDialog";
import { RequestCompletionDialog } from "@/components/growth/RequestCompletionDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface GrowthDashboardProps {
  defaultTab?: string;
}

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(defaultTab || "all");
  const {
    filteredRequests,
    allRequests,
    selectedRequest,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCompletionDialogOpen,
    setIsCompletionDialogOpen,
    handleOpenEditDialog,
    handleOpenCompletionDialog,
    handleViewDetails,
    handleRequestUpdated,
    assignRequestToMe,
    updateRequestWorkflowStatus
  } = useGrowthDashboard(defaultTab);

  // Fonction pour obtenir l'intitulé complet du type de demande
  const getRequestTypeLabel = (type: string): string => {
    switch(type) {
      case "email": return "Campagne Email";
      case "database": return "Base de données";
      case "linkedin": return "Scraping LinkedIn";
      default: return type;
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };

  // Calculer les statistiques
  const pendingRequests = allRequests.filter(req => req.workflow_status === "pending_assignment");
  const completedRequests = allRequests.filter(req => req.workflow_status === "completed");
  const lateRequests = allRequests.filter(req => req.isLate);
  const totalRequests = allRequests.length;

  const handleCreateRequest = () => {
    navigate("/requests/email/new");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
        </div>
        
        {/* Statistiques en cartes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total des demandes</p>
                  <h2 className="text-3xl font-bold">{totalRequests}</h2>
                </div>
                <div className="bg-purple-100 p-2 rounded-full">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">En attente</p>
                  <h2 className="text-3xl font-bold">{pendingRequests.length}</h2>
                </div>
                <div className="bg-orange-100 p-2 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Terminées</p>
                  <h2 className="text-3xl font-bold">{completedRequests.length}</h2>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">En retard</p>
                  <h2 className="text-3xl font-bold">{lateRequests.length}</h2>
                </div>
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtres */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button 
              variant={activeTab === "all" ? "default" : "outline"} 
              onClick={() => setActiveTab("all")}
              className="text-sm"
            >
              Toutes <span className="ml-1 bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">{totalRequests}</span>
            </Button>
            <Button 
              variant={activeTab === "pending" ? "default" : "outline"} 
              onClick={() => setActiveTab("pending")}
              className="text-sm"
            >
              En attente
            </Button>
            <Button 
              variant={activeTab === "late" ? "default" : "outline"} 
              onClick={() => setActiveTab("late")}
              className="text-sm"
            >
              En retard
            </Button>
          </div>
          <Button onClick={handleCreateRequest}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
          </Button>
        </div>
        
        {/* Tableau des demandes */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Demandes</TableHead>
                <TableHead>Mission</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Assigné à</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Aucune demande ne correspond aux critères sélectionnés
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-center">
                      <GrowthRequestTypeIcon type={request.type} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{request.title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100">
                        {getRequestTypeLabel(request.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {request.missionName || "Sans mission"}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(request.dueDate)}</TableCell>
                    <TableCell>
                      <GrowthRequestStatusBadge 
                        status={request.workflow_status || "pending_assignment"} 
                        isLate={request.isLate} 
                      />
                    </TableCell>
                    <TableCell>
                      {request.assignedToName || "Non assigné"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleViewDetails(request)}
                        >
                          <span className="sr-only">Voir</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                        >
                          <span className="sr-only">Plus</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <RequestEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedRequest={selectedRequest}
        onRequestUpdated={handleRequestUpdated}
      />
      
      <RequestCompletionDialog
        open={isCompletionDialogOpen}
        onOpenChange={setIsCompletionDialogOpen}
        selectedRequest={selectedRequest}
        onRequestUpdated={handleRequestUpdated}
      />
    </AppLayout>
  );
};

export default GrowthDashboard;
