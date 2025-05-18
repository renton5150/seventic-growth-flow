import { useState, useMemo } from 'react';
import { Request } from '@/types/types';

// Export the DateFilterType and DateFilterValues types
export type DateFilterType = 'equals' | 'before' | 'after' | 'between' | null;

export interface DateFilterValues {
  date?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

// Export the DateFilter interface
export interface DateFilter {
  type: DateFilterType;
  values: DateFilterValues;
}

// Helper pour obtenir la traduction française du type de demande
const getRequestTypeLabel = (type: string): string => {
  switch(type.toLowerCase()) {
    case "email": return "Campagne Email";
    case "database": return "Base de données";
    case "linkedin": return "Scraping LinkedIn";
    default: return type;
  }
};

export function useGrowthRequestsFilters(requests: Request[]) {
  // Column filters
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [missionFilter, setMissionFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sdrFilter, setSdrFilter] = useState<string[]>([]);
  
  // Date filters
  const [createdDateFilter, setCreatedDateFilter] = useState<DateFilter | null>(null);
  const [dueDateFilter, setDueDateFilter] = useState<DateFilter | null>(null);

  // Extract unique values for filter options with logs de débogage
  const uniqueTypes = useMemo(() => {
    const types = [...new Set(requests.map(r => {
      return getRequestTypeLabel(r.type);
    }))];
    console.log("useGrowthRequestsFilters - types extraits:", types);
    return types;
  }, [requests]);

  const uniqueMissions = useMemo(() => {
    return [...new Set(requests.map(r => r.missionName || "Sans mission"))];
  }, [requests]);

  const uniqueAssignees = useMemo(() => {
    const assignees = [...new Set(requests.map(r => r.assignedToName || "Non assigné"))];
    console.log("useGrowthRequestsFilters - assignees extraits:", assignees);
    return assignees;
  }, [requests]);

  // Correction pour extraire tous les statuts possibles
  const uniqueStatuses = useMemo(() => {
    // Collecter tous les statuts de workflow possibles
    const allStatuses = requests.map(r => {
      let status = "";
      
      // Déterminer le statut à afficher en priorité
      if (r.isLate && (r.workflow_status === "pending_assignment" || r.workflow_status === "in_progress")) {
        status = "En retard";
      } else {
        switch(r.workflow_status) {
          case "pending_assignment": status = "En attente"; break;
          case "in_progress": status = "En cours"; break;
          case "completed": status = "Terminée"; break;
          case "canceled": status = "Annulée"; break;
          default: status = r.workflow_status || "En attente";
        }
      }
      
      return status;
    });
    
    // Log pour le débogage
    console.log("Statuts extraits des requêtes:", allStatuses);
    
    // S'assurer d'inclure tous les statuts possibles même s'ils ne sont pas présents
    const possibleStatuses = ["En attente", "En cours", "Terminée", "Annulée", "En retard"];
    const combinedStatuses = [...allStatuses, ...possibleStatuses];
    
    // Retourner un ensemble unique et trié
    return [...new Set(combinedStatuses)].sort();
  }, [requests]);

  const uniqueSdrs = useMemo(() => {
    return [...new Set(requests.map(r => r.sdrName || "Non assigné"))];
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

  // Apply all filters to requests with logging détaillé
  const filteredRequests = useMemo(() => {
    console.log("useGrowthRequestsFilters - Applying filters:", {
      typeFilter,
      missionFilter,
      assigneeFilter,
      statusFilter,
      sdrFilter
    });
    
    return requests.filter(request => {
      // Apply type filter avec la traduction
      if (typeFilter.length > 0) {
        const requestTypeLabel = getRequestTypeLabel(request.type);
        if (!typeFilter.includes(requestTypeLabel)) {
          return false;
        }
      }

      // Apply mission filter
      if (missionFilter.length > 0) {
        const missionName = request.missionName || "Sans mission";
        if (!missionFilter.includes(missionName)) return false;
      }

      // Apply assignee filter - correction pour utiliser assignedToName
      if (assigneeFilter.length > 0) {
        const assigneeName = request.assignedToName || "Non assigné";
        console.log(`Filtre assignee - request.assignedToName: ${request.assignedToName}, match: ${assigneeFilter.includes(assigneeName)}`);
        if (!assigneeFilter.includes(assigneeName)) return false;
      }

      // Apply status filter - avec correction pour prendre en compte tous les statuts
      if (statusFilter.length > 0) {
        let statusLabel = "";
        
        // Déterminer le statut à afficher en priorité
        if (request.isLate && (request.workflow_status === "pending_assignment" || request.workflow_status === "in_progress")) {
          statusLabel = "En retard";
        } else {
          switch(request.workflow_status) {
            case "pending_assignment": statusLabel = "En attente"; break;
            case "in_progress": statusLabel = "En cours"; break;
            case "completed": statusLabel = "Terminée"; break;
            case "canceled": statusLabel = "Annulée"; break;
            default: statusLabel = request.workflow_status || "En attente";
          }
        }
        
        if (!statusFilter.includes(statusLabel)) return false;
      }

      // Apply SDR filter
      if (sdrFilter.length > 0) {
        const sdrName = request.sdrName || "Non assigné";
        if (!sdrFilter.includes(sdrName)) return false;
      }

      // Apply date filters
      if (!applyDateFilter(request, 'createdAt', createdDateFilter)) return false;
      if (!applyDateFilter(request, 'dueDate', dueDateFilter)) return false;

      return true;
    });
  }, [requests, typeFilter, missionFilter, assigneeFilter, statusFilter, sdrFilter, createdDateFilter, dueDateFilter]);

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
  };
}
