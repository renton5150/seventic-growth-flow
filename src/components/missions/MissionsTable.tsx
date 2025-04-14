
import { Mission } from "@/types/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash, MoreHorizontal, Calendar, CheckCircle, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MissionsTableProps {
  missions: Mission[];
  isAdmin?: boolean;
  onViewMission: (mission: Mission) => void;
  onEditMission?: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
  onMissionUpdated?: () => void;
}

const renderMissionStatusBadge = (status: "En cours" | "Fin") => {
  switch (status) {
    case "En cours":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-600 flex items-center gap-1">
          <Clock size={14} /> En cours
        </Badge>
      );
    case "Fin":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-600 flex items-center gap-1">
          <CheckCircle size={14} /> Terminée
        </Badge>
      );
    default:
      return null;
  }
};

export const MissionsTable = ({ 
  missions, 
  isAdmin = false, 
  onViewMission,
  onEditMission,
  onDeleteMission,
  onMissionUpdated,
}: MissionsTableProps) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom de la mission</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>SDR responsable</TableHead>
          <TableHead>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date de démarrage
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date de fin
            </div>
          </TableHead>
          <TableHead>Statut Mission</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {missions.map((mission) => (
          <TableRow key={mission.id}>
            <TableCell className="font-medium">{mission.name}</TableCell>
            <TableCell>
              <Badge variant={mission.type === "Full" ? "default" : "outline"}>
                {mission.type}
              </Badge>
            </TableCell>
            <TableCell>{mission.sdrName || "Non assigné"}</TableCell>
            <TableCell>{formatDate(mission.startDate)}</TableCell>
            <TableCell>{formatDate(mission.endDate)}</TableCell>
            <TableCell>{renderMissionStatusBadge(mission.status)}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewMission(mission)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
                
                {/* Dropdown menu for more actions */}
                {(onEditMission || onDeleteMission) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEditMission && (
                        <DropdownMenuItem onClick={() => onEditMission(mission)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      {onDeleteMission && (
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDeleteMission(mission)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

