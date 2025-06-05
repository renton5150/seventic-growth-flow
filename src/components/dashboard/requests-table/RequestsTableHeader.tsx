
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { CheckboxColumnFilter } from "@/components/growth/filters/CheckboxColumnFilter";
import { DateColumnFilter } from "@/components/growth/filters/DateColumnFilter";

interface RequestsTableHeaderProps {
  missionView?: boolean;
  handleSort: (column: string) => void;
  showSdr?: boolean;
  isSDR?: boolean;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  filters: {[key: string]: string[]};
  dateFilters: {[key: string]: any};
  onFilterChange: (column: string, values: string[]) => void;
  onDateFilterChange: (field: string, type: string, values: any) => void;
  uniqueValues: {[key: string]: string[]};
}

export const RequestsTableHeader = ({ 
  missionView = false, 
  handleSort,
  showSdr = false,
  isSDR = false,
  sortColumn,
  sortDirection,
  filters,
  dateFilters,
  onFilterChange,
  onDateFilterChange,
  uniqueValues
}: RequestsTableHeaderProps) => {
  
  const renderSortButton = (column: string, label: string) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(column)}
      className="h-auto p-0 font-medium justify-start"
    >
      {label}
      {sortColumn === column && (
        sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
      )}
    </Button>
  );

  const renderFilterButton = (column: string, values: string[]) => {
    console.log(`renderFilterButton - ${column} values:`, values);
    if (!values || values.length === 0) return null;
    
    return (
      <CheckboxColumnFilter
        values={values}
        selectedValues={filters[column] || []}
        onSelectionChange={(selected) => onFilterChange(column, selected)}
      />
    );
  };

  console.log("RequestsTableHeader - uniqueValues disponibles:", uniqueValues);

  return (
    <TableHeader>
      <TableRow>
        {/* Type */}
        <TableHead className="w-[50px]">
          <div className="flex flex-col space-y-1">
            {renderSortButton("type", "Type")}
            {renderFilterButton("type", uniqueValues.type || [])}
          </div>
        </TableHead>
        
        {/* Mission */}
        <TableHead>
          <div className="flex flex-col space-y-1">
            {renderSortButton("mission", "Mission")}
            {renderFilterButton("mission", uniqueValues.mission || [])}
          </div>
        </TableHead>

        {/* NOUVELLE COLONNE CLIENT */}
        <TableHead>
          <div className="flex flex-col space-y-1">
            {renderSortButton("client", "Client")}
            {renderFilterButton("client", uniqueValues.client || [])}
          </div>
        </TableHead>
        
        {/* Type de demande */}
        <TableHead className="w-[150px]">
          <div className="flex flex-col space-y-1">
            {renderSortButton("requestType", "Type de demande")}
            {renderFilterButton("requestType", uniqueValues.requestType || [])}
          </div>
        </TableHead>

        {/* Titre de la demande */}
        <TableHead>
          <div className="flex flex-col space-y-1">
            {renderSortButton("title", "Titre de la demande")}
            {renderFilterButton("title", uniqueValues.title || [])}
          </div>
        </TableHead>
        
        {/* SDR (conditionnel) */}
        {showSdr && (
          <TableHead>
            <div className="flex flex-col space-y-1">
              {renderSortButton("sdr", "SDR")}
              {renderFilterButton("sdr", uniqueValues.sdr || [])}
            </div>
          </TableHead>
        )}
        
        {/* Assigné à */}
        <TableHead>
          <div className="flex flex-col space-y-1">
            {renderSortButton("assignedTo", "Assigné à")}
            {renderFilterButton("assignedTo", uniqueValues.assignedTo || [])}
          </div>
        </TableHead>
        
        {/* Plateforme d'emailing */}
        <TableHead>
          <div className="flex flex-col space-y-1">
            {renderSortButton("emailPlatform", "Plateforme d'emailing")}
            {renderFilterButton("emailPlatform", uniqueValues.emailPlatform || [])}
          </div>
        </TableHead>
        
        {/* Créée le */}
        <TableHead>
          <div className="flex flex-col space-y-1">
            {renderSortButton("createdAt", "Créée le")}
            <DateColumnFilter
              selectedFilter={dateFilters.createdAt}
              onFilterChange={(type, values) => onDateFilterChange("createdAt", type, values)}
            />
          </div>
        </TableHead>
        
        {/* Date prévue */}
        <TableHead>
          <div className="flex flex-col space-y-1">
            {renderSortButton("dueDate", "Date prévue")}
            <DateColumnFilter
              selectedFilter={dateFilters.dueDate}
              onFilterChange={(type, values) => onDateFilterChange("dueDate", type, values)}
            />
          </div>
        </TableHead>
        
        {/* Statut */}
        <TableHead>
          <div className="flex flex-col space-y-1">
            {renderSortButton("status", "Statut")}
            {renderFilterButton("status", uniqueValues.status || [])}
          </div>
        </TableHead>
        
        {/* Actions */}
        <TableHead className="text-right w-[150px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
