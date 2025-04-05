
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  CheckCircle2, 
  Clock, 
  MoreHorizontal, 
  AlertCircle, 
  Eye,
  Mail, 
  Database as DatabaseIcon, 
  User
} from "lucide-react";
import { Request, RequestStatus } from "@/types/types";

interface RequestsTableProps {
  requests: Request[];
  missionView?: boolean;
}

export const RequestsTable = ({ requests, missionView = false }: RequestsTableProps) => {
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedRequests = [...requests].sort((a, b) => {
    switch (sortColumn) {
      case "dueDate":
        return sortDirection === "asc" 
          ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      case "title":
        return sortDirection === "asc" 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      case "status":
        return sortDirection === "asc" 
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      case "type":
        return sortDirection === "asc" 
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      default:
        return 0;
    }
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
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
            <Clock size={14} /> En cours
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-status-completed text-white flex gap-1 items-center">
            <CheckCircle2 size={14} /> Terminé
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "email":
        return "Emailing";
      case "database":
        return "Base de données";
      case "linkedin":
        return "LinkedIn";
      default:
        return type;
    }
  };

  const viewRequest = (request: Request) => {
    navigate(`/requests/${request.type}/${request.id}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[50px] text-center" 
              onClick={() => handleSort("type")}
            >
              Type
            </TableHead>
            <TableHead 
              onClick={() => handleSort("title")}
            >
              Titre
            </TableHead>
            {!missionView && (
              <TableHead>Mission</TableHead>
            )}
            <TableHead 
              onClick={() => handleSort("dueDate")}
            >
              Date prévue
            </TableHead>
            <TableHead 
              onClick={() => handleSort("status")}
            >
              Statut
            </TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRequests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={missionView ? 5 : 6} className="text-center py-10 text-muted-foreground">
                Aucune demande pour le moment
              </TableCell>
            </TableRow>
          ) : (
            sortedRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="text-center">
                  {renderTypeIcon(request.type)}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{request.title}</div>
                  <div className="text-xs text-muted-foreground">{getTypeLabel(request.type)}</div>
                </TableCell>
                {!missionView && (
                  <TableCell>Mission</TableCell>
                )}
                <TableCell>
                  {formatDate(request.dueDate)}
                </TableCell>
                <TableCell>
                  {renderStatusBadge(request.status, request.isLate)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => viewRequest(request)}>
                      <Eye size={16} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewRequest(request)}>
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
