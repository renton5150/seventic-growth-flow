
import { SortColumn, SortDirection } from "../types";
import { TableHead } from "@/components/ui/table";
import { CheckboxFilterPopover } from "../filters/CheckboxFilterPopover";
import { DateFilterPopover } from "../DateFilterPopover";
import { Calendar } from "lucide-react";

interface TableHeaderProps {
  uniqueNames: string[];
  uniqueSdrs: string[];
  uniqueStatuses: string[];
  nameFilter: string[];
  sdrFilter: string[];
  statusFilter: string[];
  setNameFilter: (values: string[]) => void;
  setSdrFilter: (values: string[]) => void;
  setStatusFilter: (values: string[]) => void;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  handleSort: (column: SortColumn) => void;
  dateFilters: any;
  setDateFilter: any;
  clearDateFilter: any;
  renderSortIndicator: (column: SortColumn) => JSX.Element | null;
}

export const TableHeader = ({
  uniqueNames,
  uniqueSdrs,
  uniqueStatuses,
  nameFilter,
  sdrFilter,
  statusFilter,
  setNameFilter,
  setSdrFilter,
  setStatusFilter,
  sortColumn,
  handleSort,
  dateFilters,
  setDateFilter,
  clearDateFilter,
  renderSortIndicator
}: TableHeaderProps) => {
  const renderSortableHeader = (column: SortColumn, label: string) => (
    <div 
      className="flex items-center gap-1 cursor-pointer" 
      onClick={() => handleSort(column)}
    >
      {label}
      {renderSortIndicator(column)}
    </div>
  );

  const renderDateHeader = (column: 'startDate' | 'endDate', label: string) => {
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
    <>
      <TableHead>
        <div className="flex items-center justify-between">
          {renderSortableHeader('name', 'Nom de la mission')}
          <CheckboxFilterPopover
            column="Nom"
            options={uniqueNames}
            selectedValues={nameFilter}
            onFilterChange={setNameFilter}
            hasFilter={nameFilter.length > 0}
            onClearFilter={() => setNameFilter([])}
          />
        </div>
      </TableHead>
      <TableHead>{renderSortableHeader('type', 'Type')}</TableHead>
      <TableHead>
        <div className="flex items-center justify-between">
          {renderSortableHeader('sdr', 'SDR responsable')}
          <CheckboxFilterPopover
            column="SDR"
            options={uniqueSdrs}
            selectedValues={sdrFilter}
            onFilterChange={setSdrFilter}
            hasFilter={sdrFilter.length > 0}
            onClearFilter={() => setSdrFilter([])}
          />
        </div>
      </TableHead>
      <TableHead>{renderDateHeader('startDate', 'Date de démarrage')}</TableHead>
      <TableHead>{renderDateHeader('endDate', 'Date de fin')}</TableHead>
      <TableHead>
        <div className="flex items-center justify-between">
          {renderSortableHeader('status', 'Statut Mission')}
          <CheckboxFilterPopover
            column="Statut"
            options={uniqueStatuses}
            selectedValues={statusFilter}
            onFilterChange={setStatusFilter}
            hasFilter={statusFilter.length > 0}
            onClearFilter={() => setStatusFilter([])}
          />
        </div>
      </TableHead>
      <TableHead>Actions</TableHead>
    </>
  );
};
