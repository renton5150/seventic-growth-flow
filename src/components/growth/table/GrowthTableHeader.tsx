
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckboxColumnFilter } from "../filters/CheckboxColumnFilter";
import { DateColumnFilter } from "../filters/DateColumnFilter";
import { Calendar } from "lucide-react";
import { columns, ColumnDefinition } from "./columns";
import { TableFilterProps } from "./types";

export function GrowthTableHeader({
  typeFilter,
  missionFilter,
  assigneeFilter,
  statusFilter,
  sdrFilter,
  createdDateFilter,
  dueDateFilter,
  setTypeFilter,
  setMissionFilter,
  setAssigneeFilter,
  setStatusFilter,
  setSdrFilter,
  handleCreatedDateFilterChange,
  handleDueDateFilterChange,
  uniqueTypes,
  uniqueMissions,
  uniqueAssignees,
  uniqueStatuses,
  uniqueSdrs,
}: TableFilterProps) {
  return (
    <TableHeader>
      <TableRow>
        {columns.map((column) => (
          <TableHead key={column.key} className={column.width}>
            {column.key === "requestType" ? (
              <div className="flex items-center justify-between">
                {column.header}
                <CheckboxColumnFilter
                  columnName="Type"
                  options={uniqueTypes}
                  selectedValues={typeFilter}
                  onFilterChange={setTypeFilter}
                  hasFilter={typeFilter.length > 0}
                  onClearFilter={() => setTypeFilter([])}
                />
              </div>
            ) : column.key === "mission" ? (
              <div className="flex items-center justify-between">
                {column.header}
                <CheckboxColumnFilter
                  columnName="Mission"
                  options={uniqueMissions}
                  selectedValues={missionFilter}
                  onFilterChange={setMissionFilter}
                  hasFilter={missionFilter.length > 0}
                  onClearFilter={() => setMissionFilter([])}
                />
              </div>
            ) : column.key === "sdr" ? (
              <div className="flex items-center justify-between">
                {column.header}
                <CheckboxColumnFilter
                  columnName="SDR"
                  options={uniqueSdrs}
                  selectedValues={sdrFilter}
                  onFilterChange={setSdrFilter}
                  hasFilter={sdrFilter.length > 0}
                  onClearFilter={() => setSdrFilter([])}
                />
              </div>
            ) : column.key === "assignedTo" ? (
              <div className="flex items-center justify-between">
                {column.header}
                <CheckboxColumnFilter
                  columnName="Assigné à"
                  options={uniqueAssignees}
                  selectedValues={assigneeFilter}
                  onFilterChange={setAssigneeFilter}
                  hasFilter={assigneeFilter.length > 0}
                  onClearFilter={() => setAssigneeFilter([])}
                />
              </div>
            ) : column.key === "createdAt" ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  {column.header}
                </div>
                <DateColumnFilter
                  columnName="Date de création"
                  hasFilter={!!createdDateFilter}
                  onFilterChange={handleCreatedDateFilterChange}
                  onClearFilter={() => handleCreatedDateFilterChange(null, {})}
                  currentFilter={createdDateFilter || undefined}
                />
              </div>
            ) : column.key === "dueDate" ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  {column.header}
                </div>
                <DateColumnFilter
                  columnName="Date prévue"
                  hasFilter={!!dueDateFilter}
                  onFilterChange={handleDueDateFilterChange}
                  onClearFilter={() => handleDueDateFilterChange(null, {})}
                  currentFilter={dueDateFilter || undefined}
                />
              </div>
            ) : column.key === "status" ? (
              <div className="flex items-center justify-between">
                {column.header}
                <CheckboxColumnFilter
                  columnName="Statut"
                  options={uniqueStatuses}
                  selectedValues={statusFilter}
                  onFilterChange={setStatusFilter}
                  hasFilter={statusFilter.length > 0}
                  onClearFilter={() => setStatusFilter([])}
                />
              </div>
            ) : (
              column.header
            )}
          </TableHead>
        ))}
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
