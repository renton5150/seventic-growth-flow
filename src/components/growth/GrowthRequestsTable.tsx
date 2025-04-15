
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Request } from "@/types/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mail,
  Database as DatabaseIcon,
  User,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  FileCheck,
  ArrowRightLeft,
  Pencil,
  Check,
  XCircle
} from "lucide-react";
import { EmptyRequestsRow } from "../dashboard/requests-table/EmptyRequestsRow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GrowthRequestsTableProps {
  requests: Request[];
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onRequestUpdated: () => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

export function GrowthRequestsTable({
  requests,
  onEditRequest,
  onCompleteRequest,
  onRequestUpdated,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab = "all"
}: GrowthRequestsTableProps) {
  const handleStartRequest = async (request: Request) => {
    try {
      if (updateRequestWorkflowStatus) {
        const success = await updateRequestWorkflowStatus(request.id, "in_progress");
        if (success) {
          onRequestUpdated();
          toast.success("La demande a été mise en cours de traitement");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la demande:", error);
      toast.error("Erreur lors de la mise à jour de la demande");
    }
  };

  const handleAssignToMe = async (requestId: string) => {
    if (assignRequestToMe) {
      const success = await assignRequestToMe(requestId);
      if (success) {
        toast.success("La demande a été assignée à vous avec succès");
        onRequestUpdated();
      } else {
        toast.error("Erreur lors de l'assignation de la demande");
      }
    }
  };

  const handleUpdateWorkflowStatus = async (requestId: string, newStatus: string) => {
    if (updateRequestWorkflowStatus) {
      const success = await updateRequestWorkflowStatus(requestId, newStatus);
      if (success) {
        const statusLabels: Record<string, string> = {
          'in_progress': 'en cours',
          'completed': 'terminée',
          'canceled': 'annulée'
        };
        toast.success(`La demande a été marquée comme ${statusLabels[newStatus]}`);
        onRequestUpdated();
      } else {
        toast.error("Erreur lors de la mise à jour du statut de la demande");
      }
    }
  };

  const renderWorkflowStatusBadge = (status: string, isLate?: boolean) => {
    if (isLate && (status === "pending_assignment" || status === "in_progress")) {
      return (
        <Badge variant="outline" className="bg-red-500 text-white flex gap-1 items-center">
          <AlertCircle size={14} /> En retard
        </Badge>
      );
    }

    switch (status) {
      case "pending_assignment":
        return (
          <Badge variant="outline" className="bg-orange-500 text-white flex gap-1 items-center">
            <Clock size={14} /> En attente d'affectation
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-500 text-white flex gap-1 items-center">
            <ArrowRightLeft size={14} /> En cours
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-500 text-white flex gap-1 items-center">
            <CheckCircle size={14} /> Terminée
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="bg-gray-500 text-white flex gap-1 items-center">
            <XCircle size={14} /> Annulée
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail size={16} className="text-seventic-500" />;
      case "database":
        return <DatabaseIcon size={16} className="text-seventic-500" />;
      case "linkedin":
        return <User size={16} className="text-seventic-500" />;
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Type</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Mission</TableHead>
            <TableHead>SDR</TableHead>
            <TableHead>Créée le</TableHead>
            <TableHead>Date prévue</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <EmptyRequestsRow colSpan={8} />
          ) : (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="text-center">
                  {renderTypeIcon(request.type)}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{request.title}</div>
                </TableCell>
                <TableCell>Mission {request.missionId}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                    {request.sdrName || "Non assigné"}
                  </div>
                </TableCell>
                <TableCell>{formatDate(request.createdAt)}</TableCell>
                <TableCell>{formatDate(request.dueDate)}</TableCell>
                <TableCell>{renderWorkflowStatusBadge(request.workflow_status || "pending_assignment", request.isLate)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditRequest(request)}
                    >
                      <Pencil size={14} className="mr-1" /> Éditer
                    </Button>
                    
                    {/* Bouton "Prendre en charge" pour l'onglet "À affecter" */}
                    {activeTab === "to_assign" && request.workflow_status === "pending_assignment" && assignRequestToMe && (
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => handleAssignToMe(request.id)}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Check className="mr-2 h-4 w-4" /> Prendre en charge
                      </Button>
                    )}
                    
                    {/* Gestion des statuts pour "Mes assignations" */}
                    {activeTab === "my_assignments" && updateRequestWorkflowStatus && (
                      request.workflow_status === "in_progress" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="bg-blue-50 border-blue-200"
                            >
                              <ArrowRightLeft className="mr-2 h-4 w-4 text-blue-500" /> Statut
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleUpdateWorkflowStatus(request.id, "completed")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Terminée
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateWorkflowStatus(request.id, "canceled")}>
                              <XCircle className="mr-2 h-4 w-4 text-gray-500" /> Annulée
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button 
                          variant="ghost"
                          size="sm"
                          disabled
                        >
                          {request.workflow_status === "completed" && (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Terminée
                            </>
                          )}
                          {request.workflow_status === "canceled" && (
                            <>
                              <XCircle className="mr-2 h-4 w-4 text-gray-500" /> Annulée
                            </>
                          )}
                        </Button>
                      )
                    )}
                    
                    {/* Boutons existants pour les autres onglets */}
                    {activeTab !== "to_assign" && activeTab !== "my_assignments" && (
                      <>
                        {request.status === "pending" && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartRequest(request)}
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" /> Commencer
                          </Button>
                        )}
                        {request.status === "inprogress" && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => onCompleteRequest(request)}
                          >
                            <FileCheck className="mr-2 h-4 w-4" /> Terminer
                          </Button>
                        )}
                        {request.status === "completed" && (
                          <Button 
                            variant="ghost"
                            size="sm"
                            disabled
                          >
                            <CheckCircle className="mr-2 h-4 w-4 text-status-completed" /> Terminée
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
