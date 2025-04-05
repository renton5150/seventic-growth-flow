
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Request, RequestStatus } from "@/types/types";
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
import { updateRequestStatus } from "@/services/requestService";
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
} from "lucide-react";
import { EmptyRequestsRow } from "../dashboard/requests-table/EmptyRequestsRow";

interface GrowthRequestsTableProps {
  requests: Request[];
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onRequestUpdated: () => void;
}

export function GrowthRequestsTable({
  requests,
  onEditRequest,
  onCompleteRequest,
  onRequestUpdated
}: GrowthRequestsTableProps) {
  const handleStartRequest = (request: Request) => {
    try {
      const updatedRequest = updateRequestStatus(request.id, "inprogress");
      if (updatedRequest) {
        onRequestUpdated();
        toast.success("La demande a été mise en cours de traitement");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la demande:", error);
      toast.error("Erreur lors de la mise à jour de la demande");
    }
  };

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
            <ArrowRightLeft size={14} /> En cours
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-status-completed text-white flex gap-1 items-center">
            <CheckCircle size={14} /> Terminé
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
                <TableCell>{renderStatusBadge(request.status, request.isLate)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditRequest(request)}
                    >
                      <Pencil size={14} className="mr-1" /> Éditer
                    </Button>
                    
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
