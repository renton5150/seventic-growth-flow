import { Request } from "@/types/types";

// Helper to translate filter values for status comparison
const getStatusFilterValue = (statusValue: string): string => {
  const lowercaseStatus = statusValue.toLowerCase();
  
  // Map French translations back to English for internal processing
  if (lowercaseStatus === "en attente") return "pending";
  if (lowercaseStatus === "en attente d'affectation") return "pending_assignment";
  if (lowercaseStatus === "en cours") return "in_progress"; // Keep for backwards compatibility
  if (lowercaseStatus === "terminé") return "completed";
  if (lowercaseStatus === "annulé") return "canceled";
  
  return lowercaseStatus;
};

export const sortRequests = (
  requests: Request[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
  filters: {[key: string]: string[]},
  dateFilters: {[key: string]: any}
): Request[] => {
  // Filter requests based on the filters
  let filteredRequests = [...requests];
  
  // Apply type filters
  if (filters.type && filters.type.length > 0) {
    filteredRequests = filteredRequests.filter(r => filters.type.includes(r.type));
  }
  
  // Apply mission filters
  if (filters.mission && filters.mission.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      const missionName = r.missionName || "Sans mission";
      return filters.mission.includes(missionName);
    });
  }
  
  // Apply SDR filters
  if (filters.sdr && filters.sdr.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      const sdrName = r.sdrName || "Non assigné";
      return filters.sdr.includes(sdrName);
    });
  }
  
  // Apply status filters with improved support for different status formats
  if (filters.status && filters.status.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      // Check if status matches any of the selected filter values
      return filters.status.some(filterStatus => {
        const normalizedFilterStatus = getStatusFilterValue(filterStatus);
        
        // Check both standard status and workflow_status
        return r.status === normalizedFilterStatus || 
               r.workflow_status === normalizedFilterStatus ||
               // Special case for in_progress that may correspond to inprogress
               (normalizedFilterStatus === "inprogress" && r.workflow_status === "in_progress") ||
               (normalizedFilterStatus === "in_progress" && r.status === "in_progress");
      });
    });
  }
  
  // Apply title filters
  if (filters.title && filters.title.length > 0) {
    filteredRequests = filteredRequests.filter(r => filters.title.includes(r.title));
  }
  
  // Apply email platform filters
  if (filters.emailPlatform && filters.emailPlatform.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      const platform = r.details?.emailPlatform || "Non spécifié";
      return filters.emailPlatform.includes(platform);
    });
  }
  
  // Apply creation date filters
  if (dateFilters.createdAt && dateFilters.createdAt.type) {
    const { type, values } = dateFilters.createdAt;
    const filterDate = new Date(values.date);
    
    filteredRequests = filteredRequests.filter(r => {
      if (!r.created_at) return false;
      
      const createdDate = new Date(r.created_at);
      
      switch (type) {
        case "equals":
          return (
            createdDate.getFullYear() === filterDate.getFullYear() &&
            createdDate.getMonth() === filterDate.getMonth() &&
            createdDate.getDate() === filterDate.getDate()
          );
        case "before":
          return createdDate < filterDate;
        case "after":
          return createdDate > filterDate;
        default:
          return true;
      }
    });
  }
  
  // Apply due date filters
  if (dateFilters.dueDate && dateFilters.dueDate.type) {
    const { type, values } = dateFilters.dueDate;
    const filterDate = new Date(values.date);
    
    filteredRequests = filteredRequests.filter(r => {
      if (!r.due_date) return false;
      
      const dueDate = new Date(r.due_date);
      
      switch (type) {
        case "equals":
          return (
            dueDate.getFullYear() === filterDate.getFullYear() &&
            dueDate.getMonth() === filterDate.getMonth() &&
            dueDate.getDate() === filterDate.getDate()
          );
        case "before":
          return dueDate < filterDate;
        case "after":
          return dueDate > filterDate;
        default:
          return true;
      }
    });
  }

  // Sort the requests
  return filteredRequests.sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch(sortColumn) {
      case "title":
        valueA = a.title.toLowerCase();
        valueB = b.title.toLowerCase();
        break;
      case "type":
        valueA = a.type.toLowerCase();
        valueB = b.type.toLowerCase();
        break;
      case "missionName":
        valueA = (a.missionName || "").toLowerCase();
        valueB = (b.missionName || "").toLowerCase();
        break;
      case "sdrName":
        valueA = (a.sdrName || "").toLowerCase();
        valueB = (b.sdrName || "").toLowerCase();
        break;
      case "status":
        valueA = a.status.toLowerCase();
        valueB = b.status.toLowerCase();
        break;
      case "dueDate":
        valueA = new Date(a.due_date).getTime();
        valueB = new Date(b.due_date).getTime();
        break;
      case "createdAt":
        valueA = a.created_at ? new Date(a.created_at).getTime() : 0;
        valueB = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
      case "emailPlatform":
        valueA = (a.details?.emailPlatform || "").toLowerCase();
        valueB = (b.details?.emailPlatform || "").toLowerCase();
        break;
      default:
        valueA = new Date(a.due_date).getTime();
        valueB = new Date(b.due_date).getTime();
    }

    const comparison = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    return sortDirection === "asc" ? comparison : -comparison;
  });
};
