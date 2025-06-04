
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
            title="Type"
            values={uniqueTypes}
            selectedValues={typeFilter}
            onSelectionChange={setTypeFilter}
          />
        </TableHead>
        <TableHead>
          <CheckboxColumnFilter
            title="Mission"
            values={uniqueMissions}
            selectedValues={missionFilter}
            onSelectionChange={setMissionFilter}
          />
        </TableHead>
        <TableHead className="w-[150px]">Type de demande</TableHead>
        {/* NOUVELLE COLONNE: Titre de la demande */}
        <TableHead>Titre de la demande</TableHead>
        <TableHead>
          <CheckboxColumnFilter
            title="SDR"
            values={uniqueSdrs}
            selectedValues={sdrFilter}
            onSelectionChange={setSdrFilter}
          />
        </TableHead>
        <TableHead>
          <CheckboxColumnFilter
            title="Assigné à"
            values={uniqueAssignees}
            selectedValues={assigneeFilter}
            onSelectionChange={setAssigneeFilter}
          />
        </TableHead>
        <TableHead>Plateforme d'emailing</TableHead>
        <TableHead>
          <DateColumnFilter
            title="Créée le"
            filterValue={createdDateFilter}
            onFilterChange={handleCreatedDateFilterChange}
          />
        </TableHead>
        <TableHead>
          <DateColumnFilter
            title="Date prévue"
            filterValue={dueDateFilter}
            onFilterChange={handleDueDateFilterChange}
          />
        </TableHead>
        <TableHead>
          <CheckboxColumnFilter
            title="Statut"
            values={uniqueStatuses}
            selectedValues={statusFilter}
            onSelectionChange={setStatusFilter}
          />
        </TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
