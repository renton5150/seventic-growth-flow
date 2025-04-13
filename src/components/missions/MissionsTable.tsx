
import { Mission } from "@/types/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash, MoreHorizontal, ArrowDown, ArrowUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MissionSortField, MissionSortOptions } from "@/hooks/useMissionsList";
import { cn } from "@/lib/utils";

interface MissionsTableProps {
  missions: Mission[];
  isAdmin?: boolean;
  onViewMission: (mission: Mission) => void;
  onEditMission?: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
  onMissionUpdated?: () => void;
  sortOptions?: MissionSortOptions;
  onSort?: (field: MissionSortField) => void;
}

export const MissionsTable = ({ 
  missions, 
  isAdmin = false, 
  onViewMission,
  onEditMission,
  onDeleteMission,
  onMissionUpdated,
  sortOptions,
  onSort
}: MissionsTableProps) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };
  
  // Fonction pour rendre les en-têtes de colonnes triables
  const renderSortableHeader = (label: string, field: MissionSortField) => {
    const isActive = sortOptions && sortOptions.field === field;
    const isAsc = isActive && sortOptions.direction === "asc";
    
    return (
      <div 
        className={cn(
          "flex items-center gap-1 cursor-pointer",
          isActive && "text-primary font-medium"
        )}
        onClick={() => onSort && onSort(field)}
      >
        {label}
        {isActive && (
          isAsc ? <ArrowUp size={14} /> : <ArrowDown size={14} />
        )}
      </div>
    );
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            {onSort 
              ? renderSortableHeader("Nom de la mission", "name")
              : "Nom de la mission"
            }
          </TableHead>
          <TableHead>
            {onSort
              ? renderSortableHeader("Type", "type")
              : "Type"
            }
          </TableHead>
          <TableHead>
            {onSort
              ? renderSortableHeader("SDR responsable", "sdrName")
              : "SDR responsable"
            }
          </TableHead>
          <TableHead>
            {onSort
              ? renderSortableHeader("Statut", "status")
              : "Statut"
            }
          </TableHead>
          <TableHead>
            {onSort
              ? renderSortableHeader("Période", "startDate")
              : "Période"
            }
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
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
            <TableCell>
              <Badge 
                variant="outline"
                className={mission.status === "Terminé" ? "bg-green-100 text-green-800 border-green-200" : ""}
              >
                {mission.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>Début: {formatDate(mission.startDate)}</div>
                {mission.endDate && <div>Fin: {formatDate(mission.endDate)}</div>}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex justify-end space-x-2">
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
