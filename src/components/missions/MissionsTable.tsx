
import { Mission } from "@/types/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash, MoreHorizontal, Calendar, CheckCircle, Clock, ChevronUp, ChevronDown, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo, useEffect } from "react";
import { DateFilterPopover } from "./DateFilterPopover";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MissionsTableProps {
  missions: Mission[];
  isAdmin?: boolean;
  onViewMission: (mission: Mission) => void;
  onEditMission?: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
  onMissionUpdated?: () => void;
}

// Types pour le tri et filtrage
type SortColumn = 'name' | 'type' | 'sdr' | 'startDate' | 'endDate' | 'status';
type SortDirection = 'asc' | 'desc';
type DateFilterType = 'equals' | 'before' | 'after' | 'between' | null;
type DateField = 'startDate' | 'endDate';

interface DateFilterValues {
  date?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
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
  // État pour le tri et le filtrage
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dateFilters, setDateFilters] = useState<{[key in DateField]?: { type: DateFilterType, values: DateFilterValues }}>({});
  
  // Fonction de formatage de date
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };
  
  // Fonction pour gérer le tri
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Définir la nouvelle colonne et réinitialiser la direction
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Fonction pour définir le filtre de date
  const setDateFilter = (field: DateField, filterType: DateFilterType, values: DateFilterValues) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: { type: filterType, values }
    }));
  };
  
  // Fonction pour effacer le filtre de date
  const clearDateFilter = (field: DateField) => {
    setDateFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  };
  
  // Récupération des préférences de tri depuis le localStorage
  useEffect(() => {
    try {
      const savedSort = localStorage.getItem('missionsTableSort');
      if (savedSort) {
        const { column, direction } = JSON.parse(savedSort);
        setSortColumn(column);
        setSortDirection(direction);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des préférences de tri:", error);
    }
  }, []);
  
  // Sauvegarde des préférences de tri dans le localStorage
  useEffect(() => {
    if (sortColumn) {
      try {
        localStorage.setItem('missionsTableSort', JSON.stringify({ column: sortColumn, direction: sortDirection }));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des préférences de tri:", error);
      }
    }
  }, [sortColumn, sortDirection]);
  
  // Filtrage des missions par date
  const filterMissionsByDate = (missionsList: Mission[]) => {
    return missionsList.filter(mission => {
      // Vérifier tous les filtres de date
      for (const [field, filter] of Object.entries(dateFilters) as [DateField, { type: DateFilterType, values: DateFilterValues }][]) {
        if (!filter.type) continue;
        
        const missionDate = mission[field];
        if (!missionDate) {
          // Si la date est null/undefined et qu'on a un filtre, cette mission ne correspond pas
          return false;
        }
        
        const mDate = new Date(missionDate);
        
        switch (filter.type) {
          case 'equals':
            if (filter.values.date && mDate.toDateString() !== filter.values.date.toDateString()) {
              return false;
            }
            break;
          case 'before':
            if (filter.values.date && mDate >= filter.values.date) {
              return false;
            }
            break;
          case 'after':
            if (filter.values.date && mDate <= filter.values.date) {
              return false;
            }
            break;
          case 'between':
            if ((filter.values.startDate && mDate < filter.values.startDate) || 
                (filter.values.endDate && mDate > filter.values.endDate)) {
              return false;
            }
            break;
        }
      }
      return true;
    });
  };
  
  // Tri et filtrage des missions avec useMemo pour éviter des re-rendus inutiles
  const sortedAndFilteredMissions = useMemo(() => {
    // D'abord filtrer par date
    let result = filterMissionsByDate([...missions]);
    
    // Ensuite trier
    if (sortColumn) {
      result.sort((a, b) => {
        let comparison = 0;
        
        switch (sortColumn) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'sdr':
            comparison = (a.sdrName || '').localeCompare(b.sdrName || '');
            break;
          case 'startDate':
            if (a.startDate && b.startDate) {
              comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            } else if (a.startDate) {
              comparison = -1;
            } else if (b.startDate) {
              comparison = 1;
            }
            break;
          case 'endDate':
            if (a.endDate && b.endDate) {
              comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
            } else if (a.endDate) {
              comparison = -1;
            } else if (b.endDate) {
              comparison = 1;
            }
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return result;
  }, [missions, sortColumn, sortDirection, dateFilters]);
  
  // Rendu des indicateurs de tri
  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };
  
  // Rendu des en-têtes triables
  const renderSortableHeader = (column: SortColumn, label: string) => (
    <div 
      className="flex items-center gap-1 cursor-pointer" 
      onClick={() => handleSort(column)}
    >
      {label}
      {renderSortIndicator(column)}
    </div>
  );
  
  // Rendu de l'en-tête avec filtre de date
  const renderDateHeader = (column: DateField, label: string) => {
    const hasFilter = dateFilters[column]?.type !== null && dateFilters[column]?.type !== undefined;
    
    return (
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-1 cursor-pointer" 
          onClick={() => handleSort(column)}
        >
          <Calendar className="h-4 w-4 mr-1" />
          {label}
          {renderSortIndicator(column as SortColumn)}
        </div>
        
        <DateFilterPopover
          hasFilter={hasFilter}
          onFilterChange={(type, values) => setDateFilter(column, type, values)}
          onClearFilter={() => clearDateFilter(column)}
          currentFilter={dateFilters[column]}
        />
      </div>
    );
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{renderSortableHeader('name', 'Nom de la mission')}</TableHead>
          <TableHead>{renderSortableHeader('type', 'Type')}</TableHead>
          <TableHead>{renderSortableHeader('sdr', 'SDR responsable')}</TableHead>
          <TableHead>{renderDateHeader('startDate', 'Date de démarrage')}</TableHead>
          <TableHead>{renderDateHeader('endDate', 'Date de fin')}</TableHead>
          <TableHead>{renderSortableHeader('status', 'Statut Mission')}</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedAndFilteredMissions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              Aucune mission ne correspond aux critères de filtre sélectionnés
            </TableCell>
          </TableRow>
        ) : (
          sortedAndFilteredMissions.map((mission) => (
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
          ))
        )}
      </TableBody>
    </Table>
  );
};
