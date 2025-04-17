import { DateFilter } from "@/hooks/useGrowthRequestsFilters";

export interface TableFilterProps {
  typeFilter: string[];
  missionFilter: string[];
  assigneeFilter: string[];
  statusFilter: string[];
  sdrFilter: string[];
  createdDateFilter: DateFilter | null;
  dueDateFilter: DateFilter | null;
  setTypeFilter: (filter: string[]) => void;
  setMissionFilter: (filter: string[]) => void;
  setAssigneeFilter: (filter: string[]) => void;
  setStatusFilter: (filter: string[]) => void;
  setSdrFilter: (filter: string[]) => void;
  handleCreatedDateFilterChange: (type: any, values: any) => void;
  handleDueDateFilterChange: (type: any, values: any) => void;
  uniqueTypes: string[];
  uniqueMissions: string[];
  uniqueAssignees: string[];
  uniqueStatuses: string[];
  uniqueSdrs: string[];
}
