
import { Mission } from "@/types/types";
import { Table, TableBody, TableHeader } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useMissionsTable } from "./hooks/useMissionsTable";
import { TableHeader } from "./table/TableHeader";
import { TableRow } from "./table/TableRow";
import { SortColumn } from "./types";

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
  onViewMission,
  onEditMission,
  onDeleteMission,
}: MissionsTableProps) => {
  const {
    sortColumn,
    sortDirection,
    handleSort,
    dateFilters,
    setDateFilter,
    clearDateFilter,
    nameFilter,
    setNameFilter,
    sdrFilter,
    setSdrFilter,
    statusFilter,
    setStatusFilter,
    uniqueNames,
    uniqueSdrs,
    uniqueStatuses,
    sortedAndFilteredMissions
  } = useMissionsTable(missions);

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableHeader
          uniqueNames={uniqueNames}
          uniqueSdrs={uniqueSdrs}
          uniqueStatuses={uniqueStatuses}
          nameFilter={nameFilter}
          sdrFilter={sdrFilter}
          statusFilter={statusFilter}
          setNameFilter={setNameFilter}
          setSdrFilter={setSdrFilter}
          setStatusFilter={setStatusFilter}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          handleSort={handleSort}
          dateFilters={dateFilters}
          setDateFilter={setDateFilter}
          clearDateFilter={clearDateFilter}
          renderSortIndicator={renderSortIndicator}
        />
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
            <TableRow
              key={mission.id}
              mission={mission}
              onViewMission={onViewMission}
              onEditMission={onEditMission}
              onDeleteMission={onDeleteMission}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};
