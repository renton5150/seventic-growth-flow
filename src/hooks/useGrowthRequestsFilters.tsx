
import { useState, useMemo } from 'react';
import { Request } from '@/types/types';

type DateFilterType = 'equals' | 'before' | 'after' | 'between' | null;

interface DateFilterValues {
  date?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

interface DateFilter {
  type: DateFilterType;
  values: DateFilterValues;
}

export function useGrowthRequestsFilters(requests: Request[]) {
  // Column filters
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [missionFilter, setMissionFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
  // Date filters
  const [createdDateFilter, setCreatedDateFilter] = useState<DateFilter | null>(null);
  const [dueDateFilter, setDueDateFilter] = useState<DateFilter | null>(null);

  // Extract unique values for filter options
  const uniqueTypes = useMemo(() => {
    const types = [...new Set(requests.map(r => r.type))];
    return types.map(type => {
      switch(type) {
        case "email": return "Campagne Email";
        case "database": return "Base de données";
        case "linkedin": return "Scraping LinkedIn";
        default: return type;
      }
    });
  }, [requests]);

  const uniqueMissions = useMemo(() => {
    return [...new Set(requests.map(r => r.missionName || "Sans mission"))];
  }, [requests]);

  const uniqueAssignees = useMemo(() => {
    return [...new Set(requests.map(r => r.assignedToName || "Non assigné"))];
  }, [requests]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(requests.map(r => {
      switch(r.workflow_status) {
        case "pending_assignment": return "En attente";
        case "in_progress": return "En cours";
        case "completed": return "Terminée";
        case "canceled": return "Annulée";
        default: return r.workflow_status || "En attente";
      }
    }))];
  }, [requests]);

  // Handle date filtering
  const applyDateFilter = (request: Request, dateField: 'createdAt' | 'dueDate', filter: DateFilter | null): boolean => {
    if (!filter || !filter.type) return true;
    
    const requestDate = request[dateField];
    if (!requestDate) return false;
    
    const date = new Date(requestDate);
    
    switch (filter.type) {
      case 'equals':
        if (!filter.values.date) return true;
        return date.toDateString() === filter.values.date.toDateString();
      case 'before':
        if (!filter.values.date) return true;
        return date < filter.values.date;
      case 'after':
        if (!filter.values.date) return true;
        return date > filter.values.date;
      case 'between':
        if (!filter.values.startDate || !filter.values.endDate) return true;
        return date >= filter.values.startDate && date <= filter.values.endDate;
      default:
        return true;
    }
  };

  // Apply all filters to requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // Apply type filter
      if (typeFilter.length > 0) {
        const requestTypeLabel = (() => {
          switch(request.type) {
            case "email": return "Campagne Email";
            case "database": return "Base de données";
            case "linkedin": return "Scraping LinkedIn";
            default: return request.type;
          }
        })();
        if (!typeFilter.includes(requestTypeLabel)) return false;
      }

      // Apply mission filter
      if (missionFilter.length > 0) {
        const missionName = request.missionName || "Sans mission";
        if (!missionFilter.includes(missionName)) return false;
      }

      // Apply assignee filter
      if (assigneeFilter.length > 0) {
        const assigneeName = request.assignedToName || "Non assigné";
        if (!assigneeFilter.includes(assigneeName)) return false;
      }

      // Apply status filter
      if (statusFilter.length > 0) {
        const statusLabel = (() => {
          switch(request.workflow_status) {
            case "pending_assignment": return "En attente";
            case "in_progress": return "En cours";
            case "completed": return "Terminée";
            case "canceled": return "Annulée";
            default: return request.workflow_status || "En attente";
          }
        })();
        if (!statusFilter.includes(statusLabel)) return false;
      }

      // Apply date filters
      if (!applyDateFilter(request, 'createdAt', createdDateFilter)) return false;
      if (!applyDateFilter(request, 'dueDate', dueDateFilter)) return false;

      return true;
    });
  }, [requests, typeFilter, missionFilter, assigneeFilter, statusFilter, createdDateFilter, dueDateFilter]);

  // Handle date filter changes
  const handleCreatedDateFilterChange = (type: DateFilterType, values: DateFilterValues) => {
    setCreatedDateFilter(type ? { type, values } : null);
  };

  const handleDueDateFilterChange = (type: DateFilterType, values: DateFilterValues) => {
    setDueDateFilter(type ? { type, values } : null);
  };

  return {
    filteredRequests,
    typeFilter,
    missionFilter,
    assigneeFilter,
    statusFilter,
    createdDateFilter,
    dueDateFilter,
    setTypeFilter,
    setMissionFilter,
    setAssigneeFilter,
    setStatusFilter,
    handleCreatedDateFilterChange,
    handleDueDateFilterChange,
    uniqueTypes,
    uniqueMissions,
    uniqueAssignees,
    uniqueStatuses
  };
}
