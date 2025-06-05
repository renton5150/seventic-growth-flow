
import { Request } from "@/types/types";

export const sortRequests = (
  requests: Request[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
  filters: { [key: string]: string[] },
  dateFilters: { [key: string]: any }
): Request[] => {
  console.log("sortRequests - Filtres appliqués:", filters);
  console.log("sortRequests - Nombre de requêtes avant filtrage:", requests.length);

  // Appliquer les filtres d'abord
  let filteredRequests = requests.filter((request) => {
    // Filtre par type
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(request.type)) return false;
    }

    // Filtre par mission
    if (filters.mission && filters.mission.length > 0) {
      const missionName = request.missionName || "Sans mission";
      if (!filters.mission.includes(missionName)) return false;
    }

    // NOUVEAU : Filtre par client
    if (filters.client && filters.client.length > 0) {
      const clientName = request.missionClient || "Sans client";
      if (!filters.client.includes(clientName)) return false;
    }

    // Filtre par SDR
    if (filters.sdr && filters.sdr.length > 0) {
      const sdrName = request.sdrName || "Non assigné";
      if (!filters.sdr.includes(sdrName)) return false;
    }

    // Filtre par assigné à
    if (filters.assignedTo && filters.assignedTo.length > 0) {
      const assignedToName = request.assignedToName || "Non assigné";
      if (!filters.assignedTo.includes(assignedToName)) return false;
    }

    // Filtre par titre
    if (filters.title && filters.title.length > 0) {
      if (!filters.title.includes(request.title)) return false;
    }

    // Filtre par type de demande (formaté)
    if (filters.requestType && filters.requestType.length > 0) {
      let requestTypeLabel = "";
      switch(request.type) {
        case "email": requestTypeLabel = "Campagne Email"; break;
        case "database": requestTypeLabel = "Base de données"; break;
        case "linkedin": requestTypeLabel = "Scraping LinkedIn"; break;
        default: requestTypeLabel = request.type;
      }
      if (!filters.requestType.includes(requestTypeLabel)) return false;
    }

    // Filtre par plateforme d'emailing
    if (filters.emailPlatform && filters.emailPlatform.length > 0) {
      const emailPlatform = request.details?.emailPlatform || "Non spécifié";
      if (!filters.emailPlatform.includes(emailPlatform)) return false;
    }

    // Filtre par statut
    if (filters.status && filters.status.length > 0) {
      const status = request.workflow_status || request.status || "pending";
      if (!filters.status.includes(status)) return false;
    }

    // Filtres de date
    if (dateFilters.createdAt) {
      const { type, values } = dateFilters.createdAt;
      const requestDate = new Date(request.createdAt);
      
      if (type === "exact" && values) {
        const filterDate = new Date(values);
        if (requestDate.toDateString() !== filterDate.toDateString()) return false;
      } else if (type === "range" && values?.start && values?.end) {
        const startDate = new Date(values.start);
        const endDate = new Date(values.end);
        if (requestDate < startDate || requestDate > endDate) return false;
      } else if (type === "before" && values) {
        const beforeDate = new Date(values);
        if (requestDate >= beforeDate) return false;
      } else if (type === "after" && values) {
        const afterDate = new Date(values);
        if (requestDate <= afterDate) return false;
      }
    }

    if (dateFilters.dueDate) {
      const { type, values } = dateFilters.dueDate;
      const requestDate = new Date(request.dueDate);
      
      if (type === "exact" && values) {
        const filterDate = new Date(values);
        if (requestDate.toDateString() !== filterDate.toDateString()) return false;
      } else if (type === "range" && values?.start && values?.end) {
        const startDate = new Date(values.start);
        const endDate = new Date(values.end);
        if (requestDate < startDate || requestDate > endDate) return false;
      } else if (type === "before" && values) {
        const beforeDate = new Date(values);
        if (requestDate >= beforeDate) return false;
      } else if (type === "after" && values) {
        const afterDate = new Date(values);
        if (requestDate <= afterDate) return false;
      }
    }

    return true;
  });

  console.log("sortRequests - Nombre de requêtes après filtrage:", filteredRequests.length);

  // Ensuite trier
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "type":
        aValue = a.type;
        bValue = b.type;
        break;
      case "mission":
        aValue = a.missionName || "Sans mission";
        bValue = b.missionName || "Sans mission";
        break;
      case "client": // NOUVEAU : tri par client
        aValue = a.missionClient || "Sans client";
        bValue = b.missionClient || "Sans client";
        break;
      case "title":
        aValue = a.title;
        bValue = b.title;
        break;
      case "sdr":
        aValue = a.sdrName || "Non assigné";
        bValue = b.sdrName || "Non assigné";
        break;
      case "assignedTo":
        aValue = a.assignedToName || "Non assigné";
        bValue = b.assignedToName || "Non assigné";
        break;
      case "status":
        aValue = a.workflow_status || a.status || "pending";
        bValue = b.workflow_status || b.status || "pending";
        break;
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case "dueDate":
        aValue = new Date(a.dueDate);
        bValue = new Date(b.dueDate);
        break;
      default:
        aValue = a.title;
        bValue = b.title;
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  return sortedRequests;
};
