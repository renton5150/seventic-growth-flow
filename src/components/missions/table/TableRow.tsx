
import { Mission } from "@/types/types";
import { TableCell, TableRow as UITableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, Pencil, Trash, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { renderMissionStatusBadge } from "../utils/statusBadge";

interface TableRowProps {
  mission: Mission;
  onViewMission: (mission: Mission) => void;
  onEditMission?: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
}

export const TableRow = ({
  mission,
  onViewMission,
  onEditMission,
  onDeleteMission,
}: TableRowProps) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };

  return (
    <UITableRow>
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
    </UITableRow>
  );
};
