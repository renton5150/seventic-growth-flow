
import { Link, useNavigate } from "react-router-dom";
import { Mission } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth";
import { MissionSortField, SortDirection, SortOptions } from "@/hooks/useMissionsList";

interface MissionsTableProps {
  missions: Mission[];
  isAdmin?: boolean;
  onViewMission: (mission: Mission) => void;
  onEditMission?: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
  onMissionUpdated?: () => void;
  sortOptions: SortOptions;
  onSort: (field: MissionSortField) => void;
}

export const MissionsTable = ({
  missions,
  isAdmin = false,
  onViewMission,
  onEditMission,
  onDeleteMission,
  sortOptions,
  onSort
}: MissionsTableProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSdr = user?.role === "sdr";

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };

  // Fonction pour afficher l'icône de tri
  const renderSortIcon = (field: MissionSortField) => {
    if (sortOptions.field !== field) return null;
    return sortOptions.direction === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  // Fonction pour obtenir la classe CSS de l'en-tête de colonne triable
  const getSortableHeaderClass = (field: MissionSortField) => {
    return `cursor-pointer hover:bg-muted transition-colors ${
      sortOptions.field === field ? "text-primary font-medium" : ""
    }`;
  };

  // Fonction pour déterminer la route de détail selon le rôle
  const getMissionDetailRoute = (missionId: string) => {
    return isAdmin ? `/admin/missions/${missionId}` : `/missions/${missionId}`;
  };

  return (
    <div className="rounded-md border animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th 
                className={getSortableHeaderClass("name")}
                onClick={() => onSort("name")}
              >
                <div className="flex items-center px-4 py-2">
                  Nom {renderSortIcon("name")}
                </div>
              </th>
              <th 
                className={getSortableHeaderClass("sdrName")}
                onClick={() => onSort("sdrName")}
              >
                <div className="flex items-center px-4 py-2">
                  SDR {renderSortIcon("sdrName")}
                </div>
              </th>
              <th 
                className={getSortableHeaderClass("startDate")}
                onClick={() => onSort("startDate")}
              >
                <div className="flex items-center px-4 py-2">
                  Début {renderSortIcon("startDate")}
                </div>
              </th>
              <th 
                className={getSortableHeaderClass("endDate")}
                onClick={() => onSort("endDate")}
              >
                <div className="flex items-center px-4 py-2">
                  Fin {renderSortIcon("endDate")}
                </div>
              </th>
              <th 
                className={getSortableHeaderClass("type")}
                onClick={() => onSort("type")}
              >
                <div className="flex items-center px-4 py-2">
                  Type {renderSortIcon("type")}
                </div>
              </th>
              <th 
                className={getSortableHeaderClass("status")}
                onClick={() => onSort("status")}
              >
                <div className="flex items-center px-4 py-2">
                  Statut {renderSortIcon("status")}
                </div>
              </th>
              <th className="px-4 py-2 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => {
              const canEdit = isAdmin || (isSdr && mission.sdrId === user?.id);
              const canDelete = isAdmin;
              const detailRoute = getMissionDetailRoute(mission.id);

              return (
                <tr key={mission.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-2 font-medium">
                    <Link to={detailRoute} className="hover:underline">
                      {mission.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{mission.sdrName || "-"}</td>
                  <td className="px-4 py-2">{formatDate(mission.startDate)}</td>
                  <td className="px-4 py-2">{formatDate(mission.endDate)}</td>
                  <td className="px-4 py-2">
                    <Badge variant={mission.type === "Full" ? "default" : "outline"}>
                      {mission.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Badge 
                      variant={
                        mission.status === "En cours" ? "default" :
                        mission.status === "Terminée" ? "success" :
                        mission.status === "En pause" ? "warning" : "destructive"
                      }
                    >
                      {mission.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(detailRoute)}
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Voir les détails</span>
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {canEdit && onEditMission && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditMission(mission)}
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Modifier</span>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {canDelete && onDeleteMission && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteMission(mission)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <span className="sr-only">Supprimer</span>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
