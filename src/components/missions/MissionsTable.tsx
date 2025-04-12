
import { Mission } from "@/types/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash } from "lucide-react";

interface MissionsTableProps {
  missions: Mission[];
  isAdmin?: boolean;
  onViewMission: (mission: Mission) => void;
  onEditMission?: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
  onMissionUpdated?: () => void;
}

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
                
                {onEditMission && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditMission(mission)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                )}
                
                {onDeleteMission && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteMission(mission)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
