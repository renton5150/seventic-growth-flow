
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckboxColumnFilter } from "../filters/CheckboxColumnFilter";
import { DateColumnFilter } from "../filters/DateColumnFilter";

interface GrowthTableHeaderProps {
  typeFilter: string[];
  missionFilter: string[];
  assigneeFilter: string[];
  statusFilter: string[];
  sdrFilter: string[];
  createdDateFilter: any;
  dueDateFilter: any;
  setTypeFilter: (values: string[]) => void;
  setMissionFilter: (values: string[]) => void;
  setAssigneeFilter: (values: string[]) => void;
  setStatusFilter: (values: string[]) => void;
  setSdrFilter: (values: string[]) => void;
  handleCreatedDateFilterChange: (type: string, values: any) => void;
  handleDueDateFilterChange: (type: string, values: any) => void;
  uniqueTypes: string[];
  uniqueMissions: string[];
  uniqueAssignees: string[];
  uniqueStatuses: string[];
  uniqueSdrs: string[];
}

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
  uniqueSdrs
}: GrowthTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[60px]">
          <CheckboxColumnFilter
            columnName="Type"
            options={uniqueTypes}
            selectedValues={typeFilter}
            onFilterChange={setTypeFilter}
            hasFilter={typeFilter.length > 0}
            onClearFilter={() => setTypeFilter([])}
          />
        </TableHead>
        <TableHead>
          <CheckboxColumnFilter
            columnName="Mission"
            options={uniqueMissions}
            selectedValues={missionFilter}
            onFilterChange={setMissionFilter}
            hasFilter={missionFilter.length > 0}
            onClearFilter={() => setMissionFilter([])}
          />
        </TableHead>
        <TableHead className="w-[150px]">Type de demande</TableHead>
        {/* NOUVELLE COLONNE: Titre de la demande */}
        <TableHead>Titre de la demande</TableHead>
        <TableHead>
          <CheckboxColumnFilter
            columnName="SDR"
            options={uniqueSdrs}
            selectedValues={sdrFilter}
            onFilterChange={setSdrFilter}
            hasFilter={sdrFilter.length > 0}
            onClearFilter={() => setSdrFilter([])}
          />
        </TableHead>
        <TableHead>
          <CheckboxColumnFilter
            columnName="Assigné à"
            options={uniqueAssignees}
            selectedValues={assigneeFilter}
            onFilterChange={setAssigneeFilter}
            hasFilter={assigneeFilter.length > 0}
            onClearFilter={() => setAssigneeFilter([])}
          />
        </TableHead>
        <TableHead>Plateforme d'emailing</TableHead>
        <TableHead>
          <DateColumnFilter
            columnName="Créée le"
            hasFilter={!!createdDateFilter?.type}
            onFilterChange={handleCreatedDateFilterChange}
            onClearFilter={() => handleCreatedDateFilterChange("", {})}
            currentFilter={createdDateFilter}
          />
        </TableHead>
        <TableHead>
          <DateColumnFilter
            columnName="Date prévue"
            hasFilter={!!dueDateFilter?.type}
            onFilterChange={handleDueDateFilterChange}
            onClearFilter={() => handleDueDateFilterChange("", {})}
            currentFilter={dueDateFilter}
          />
        </TableHead>
        <TableHead>
          <CheckboxColumnFilter
            columnName="Statut"
            options={uniqueStatuses}
            selectedValues={statusFilter}
            onFilterChange={setStatusFilter}
            hasFilter={statusFilter.length > 0}
            onClearFilter={() => setStatusFilter([])}
          />
        </TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
