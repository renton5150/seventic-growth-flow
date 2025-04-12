
import { Mission } from "@/types/types";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useState } from "react";
import { EditMissionDialog } from "./EditMissionDialog";

interface MissionsTableProps {
  missions: Mission[];
  isAdmin: boolean;
  onViewMission: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
  onMissionUpdated?: () => void;
}

export const MissionsTable = ({ 
  missions, 
  isAdmin, 
  onViewMission, 
  onDeleteMission,
  onMissionUpdated
}: MissionsTableProps) => {
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [missionToEdit, setMissionToEdit] = useState<Mission | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fonction pour formater les dates
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };

  // Gérer le tri
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Ouvrir le dialogue d'édition pour une mission
  const handleEditMission = (mission: Mission) => {
    console.log("Ouverture du dialogue d'édition pour la mission:", mission);
    setMissionToEdit(mission);
    setIsEditDialogOpen(true);
  };

  // Clôturer l'édition et rafraîchir les données au besoin
  const handleEditComplete = () => {
    console.log("Édition terminée, rafraîchissement des données");
    if (onMissionUpdated) {
      onMissionUpdated();
    }
  };

  // Appliquer le tri
  const sortedMissions = useMemo(() => {
    return [...missions].sort((a, b) => {
      const factor = sortDirection === "asc" ? 1 : -1;
      
      switch (sortColumn) {
        case "name":
          return a.name.localeCompare(b.name) * factor;
        case "sdrName":
          return (a.sdrName || "").localeCompare(b.sdrName || "") * factor;
        case "createdAt":
          return ((new Date(a.createdAt)).getTime() - (new Date(b.createdAt)).getTime()) * factor;
        case "requests":
          return (a.requests.length - b.requests.length) * factor;
        case "startDate":
          // Gérer le cas où startDate est null
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return factor;
          if (!b.startDate) return -factor;
          return ((new Date(a.startDate)).getTime() - (new Date(b.startDate)).getTime()) * factor;
        case "type":
          return a.type.localeCompare(b.type) * factor;
        default:
          return 0;
      }
    });
  }, [missions, sortColumn, sortDirection]);

  // Composant pour les en-têtes triables
  const SortableHeader = ({ column, label }: { column: string; label: string }) => {
    const isActive = sortColumn === column;
    const sortIcon = isActive ? (sortDirection === "asc" ? " ↑" : " ↓") : "";
    
    return (
      <TableHead 
        onClick={() => handleSort(column)}
        className="cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-center gap-1">
          {label}
          <span className="font-bold">{sortIcon}</span>
        </div>
      </TableHead>
    );
  };

  return (
    <>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="name" label="Nom" />
              <SortableHeader column="sdrName" label="SDR responsable" />
              <SortableHeader column="type" label="Type" />
              <SortableHeader column="startDate" label="Dates" />
              <SortableHeader column="createdAt" label="Créée le" />
              <SortableHeader column="requests" label="Demandes" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMissions.map((mission) => (
              <TableRow key={mission.id}>
                <TableCell className="font-medium">{mission.name}</TableCell>
                <TableCell>{mission.sdrName || "Non assigné"}</TableCell>
                <TableCell>
                  <Badge variant={mission.type === "Full" ? "default" : "outline"}>
                    {mission.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDate(mission.startDate)}
                  {mission.endDate && (
                    <> → {formatDate(mission.endDate)}</>
                  )}
                </TableCell>
                <TableCell>{formatDate(mission.createdAt)}</TableCell>
                <TableCell>
                  {mission.requests.length > 0 ? (
                    <Badge variant="secondary">{mission.requests.length}</Badge>
                  ) : (
                    "Aucune"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onViewMission(mission)}>
                      <Eye className="h-4 w-4 mr-1" /> Voir
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="hover:bg-blue-50"
                      onClick={() => handleEditMission(mission)}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Modifier
                    </Button>
                    
                    {isAdmin && onDeleteMission && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDeleteMission(mission)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Dialogue d'édition */}
      <EditMissionDialog
        mission={missionToEdit}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onMissionUpdated={handleEditComplete}
      />
    </>
  );
};
