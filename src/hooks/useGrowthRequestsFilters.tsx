import { useState, useMemo } from "react";
import { Request, WorkflowStatus } from "@/types/types";

export interface DateFilter {
  from: Date | null;
  to: Date | null;
}

export const useGrowthRequestsFilters = (requests: Request[]) => {
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [missionFilter, setMissionFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sdrFilter, setSdrFilter] = useState<string[]>([]);
  const [createdDateFilter, setCreatedDateFilter] = useState<DateFilter | null>(null);
  const [dueDateFilter, setDueDateFilter] = useState<DateFilter | null>(null);

  const handleCreatedDateFilterChange = (type: "from" | "to", value: Date | null) => {
    setCreatedDateFilter(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleDueDateFilterChange = (type: "from" | "to", value: Date | null) => {
    setDueDateFilter(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(item => {
      const typeCondition = typeFilter.length === 0 || typeFilter.includes(item.type);
      const missionCondition = missionFilter.length === 0 || missionFilter.includes(item.missionName || "");
      const assigneeCondition = assigneeFilter.length === 0 || assigneeFilter.includes(item.assigned_to_name || "");
      const statusCondition = statusFilter.length === 0 || statusFilter.includes(item.workflow_status || "");
      const sdrCondition = sdrFilter.length === 0 || sdrFilter.includes(item.sdrName || "");

      const createdDateCondition = !createdDateFilter || (
        (!createdDateFilter.from || new Date(item.created_at) >= createdDateFilter.from) &&
        (!createdDateFilter.to || new Date(item.created_at) <= createdDateFilter.to)
      );

      const dueDateCondition = !dueDateFilter || (
        (!dueDateFilter.from || new Date(item.due_date) >= dueDateFilter.from) &&
        (!dueDateFilter.to || new Date(item.due_date) <= dueDateFilter.to)
      );

      return (
        typeCondition &&
        missionCondition &&
        assigneeCondition &&
        statusCondition &&
        sdrCondition &&
        createdDateCondition &&
        dueDateCondition
      );
    });
  }, [requests, typeFilter, missionFilter, assigneeFilter, statusFilter, sdrFilter, createdDateFilter, dueDateFilter]);

  const uniqueTypes = useMemo(() => {
    return [...new Set(requests.map(item => item.type))];
  }, [requests]);

  const uniqueMissions = useMemo(() => {
    return [...new Set(requests.map(item => item.missionName || ""))];
  }, [requests]);

  const uniqueAssignees = useMemo(() => {
    return [...new Set(requests.map(item => item.assigned_to_name || ""))];
  }, [requests]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(requests.map(item => item.workflow_status || ""))];
  }, [requests]);

  const uniqueSdrs = useMemo(() => {
    return [...new Set(requests.map(item => item.sdrName || ""))];
  }, [requests]);

  const isStatusType = (status: string): status is WorkflowStatus => {
    return status === "pending_assignment" || status === "assigned" || status === "in_progress" || status === "review" || status === "completed";
  };

  const isValidStatus = (status: string): boolean => {
    if (isStatusType(status)) {
      return true;
    }
    return status === "canceled";
  };

  return {
    filteredRequests,
    typeFilter,
    setTypeFilter,
    missionFilter,
    setMissionFilter,
    assigneeFilter,
    setAssigneeFilter,
    statusFilter,
    setStatusFilter,
    sdrFilter,
    setSdrFilter,
    createdDateFilter,
    handleCreatedDateFilterChange,
    dueDateFilter,
    handleDueDateFilterChange,
    uniqueTypes,
    uniqueMissions,
    uniqueAssignees,
    uniqueStatuses,
    uniqueSdrs,
    isValidStatus
  };
};
