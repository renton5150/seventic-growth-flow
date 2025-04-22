
import { Request } from "@/types/types";

export const sortRequests = (
  requests: Request[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
  filters: {[key: string]: string[]},
  dateFilters: {[key: string]: any}
): Request[] => {
  // Filtrer les demandes en fonction des filtres
  let filteredRequests = [...requests];
  
  // Appliquer les filtres de type
  if (filters.type && filters.type.length > 0) {
    filteredRequests = filteredRequests.filter(r => filters.type.includes(r.type));
  }
  
  // Appliquer les filtres de mission
  if (filters.mission && filters.mission.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      const missionName = r.missionName || "Sans mission";
      return filters.mission.includes(missionName);
    });
  }
  
  // Appliquer les filtres de SDR
  if (filters.sdr && filters.sdr.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      const sdrName = r.sdrName || "Non assigné";
      return filters.sdr.includes(sdrName);
    });
  }
  
  // Appliquer les filtres de statut
  if (filters.status && filters.status.length > 0) {
    filteredRequests = filteredRequests.filter(r => filters.status.includes(r.status));
  }
  
  // Appliquer les filtres de titre
  if (filters.title && filters.title.length > 0) {
    filteredRequests = filteredRequests.filter(r => filters.title.includes(r.title));
  }
  
  // Appliquer les filtres de plateforme d'emailing
  if (filters.emailPlatform && filters.emailPlatform.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      const platform = r.details?.emailPlatform || "Non spécifié";
      return filters.emailPlatform.includes(platform);
    });
  }
  
  // Appliquer les filtres de date de création
  if (dateFilters.createdAt && dateFilters.createdAt.type) {
    const { type, values } = dateFilters.createdAt;
    const filterDate = new Date(values.date);
    
    filteredRequests = filteredRequests.filter(r => {
      if (!r.createdAt) return false;
      
      const createdDate = new Date(r.createdAt);
      
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
  
  // Appliquer les filtres de date d'échéance
  if (dateFilters.dueDate && dateFilters.dueDate.type) {
    const { type, values } = dateFilters.dueDate;
    const filterDate = new Date(values.date);
    
    filteredRequests = filteredRequests.filter(r => {
      if (!r.dueDate) return false;
      
      const dueDate = new Date(r.dueDate);
      
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

  // Trier les demandes
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
        valueA = new Date(a.dueDate).getTime();
        valueB = new Date(b.dueDate).getTime();
        break;
      case "createdAt":
        valueA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valueB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        break;
      case "emailPlatform":
        valueA = (a.details?.emailPlatform || "").toLowerCase();
        valueB = (b.details?.emailPlatform || "").toLowerCase();
        break;
      default:
        valueA = new Date(a.dueDate).getTime();
        valueB = new Date(b.dueDate).getTime();
    }

    const comparison = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    return sortDirection === "asc" ? comparison : -comparison;
  });
};
