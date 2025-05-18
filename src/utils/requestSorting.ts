
import { Request } from "@/types/types";

// Helper to translate filter values for status comparison
const getStatusFilterValue = (statusValue: string): string => {
  const lowercaseStatus = statusValue.toLowerCase();
  
  // Map French translations back to English for internal processing
  if (lowercaseStatus === "en attente") return "pending";
  if (lowercaseStatus === "en attente d'affectation") return "pending_assignment";
  if (lowercaseStatus === "en cours") return "inprogress"; // Keep for backwards compatibility
  if (lowercaseStatus === "terminé") return "completed";
  if (lowercaseStatus === "annulé") return "canceled";
  
  return lowercaseStatus;
};

// Helper pour obtenir la traduction française du type de demande
const getRequestTypeLabel = (type: string): string => {
  switch(type.toLowerCase()) {
    case "email": return "Campagne Email";
    case "database": return "Base de données";
    case "linkedin": return "Scraping LinkedIn";
    default: return type;
  }
};

export const sortRequests = (
  requests: Request[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
  filters: {[key: string]: string[]},
  dateFilters: {[key: string]: any}
): Request[] => {
  // Log complet des filtres pour le débogage
  console.log("sortRequests - Filtres appliqués:", filters);
  console.log("sortRequests - Nombre de requêtes avant filtrage:", requests.length);
  
  // Filtrer les demandes en fonction des filtres
  let filteredRequests = [...requests];
  
  // Appliquer les filtres de type
  if (filters.type && filters.type.length > 0) {
    filteredRequests = filteredRequests.filter(r => filters.type.includes(r.type));
    console.log("Après filtre type:", filteredRequests.length);
  }
  
  // Appliquer les filtres de mission
  if (filters.mission && filters.mission.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      const missionName = r.missionName || "Sans mission";
      return filters.mission.includes(missionName);
    });
    console.log("Après filtre mission:", filteredRequests.length);
  }
  
  // Appliquer les filtres de SDR
  if (filters.sdr && filters.sdr.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      const sdrName = r.sdrName || "Non assigné";
      return filters.sdr.includes(sdrName);
    });
    console.log("Après filtre sdr:", filteredRequests.length);
  }
  
  // CORRECTION: Améliorer le filtre de type de demande (requestType)
  if (filters.requestType && filters.requestType.length > 0) {
    console.log("Filtrage par type de demande:", filters.requestType);
    
    filteredRequests = filteredRequests.filter(r => {
      // Obtenir le label français pour ce type
      const requestTypeLabel = getRequestTypeLabel(r.type);
      
      // Log pour vérifier la correspondance
      console.log(`Comparaison - Type: ${r.type}, Label: ${requestTypeLabel}, Match: ${filters.requestType.includes(requestTypeLabel)}`);
      
      return filters.requestType.includes(requestTypeLabel);
    });
    console.log("Après filtre requestType:", filteredRequests.length);
  }
  
  // CORRECTION: Améliorer le filtre d'assignation (assignedTo)
  if (filters.assignedTo && filters.assignedTo.length > 0) {
    console.log("Filtrage par assigné à:", filters.assignedTo);
    
    filteredRequests = filteredRequests.filter(r => {
      const assignedToName = r.assignedToName || "Non assigné";
      
      // Log pour vérifier la correspondance
      console.log(`Comparaison - Assigné à: ${assignedToName}, Match: ${filters.assignedTo.includes(assignedToName)}`);
      
      return filters.assignedTo.includes(assignedToName);
    });
    console.log("Après filtre assignedTo:", filteredRequests.length);
  }
  
  // Appliquer les filtres de statut avec support amélioré pour les différents formats de statut
  if (filters.status && filters.status.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      // Check if status matches any of the selected filter values
      return filters.status.some(filterStatus => {
        const normalizedFilterStatus = getStatusFilterValue(filterStatus);
        
        // Vérifie le statut standard et le workflow_status
        return r.status === normalizedFilterStatus || 
               r.workflow_status === normalizedFilterStatus ||
               // Cas spécial pour in_progress qui peut correspondre à inprogress
               (normalizedFilterStatus === "inprogress" && r.workflow_status === "in_progress") ||
               (normalizedFilterStatus === "in_progress" && r.status === "inprogress");
      });
    });
    console.log("Après filtre status:", filteredRequests.length);
  }
  
  // Appliquer les filtres de titre
  if (filters.title && filters.title.length > 0) {
    filteredRequests = filteredRequests.filter(r => filters.title.includes(r.title));
    console.log("Après filtre title:", filteredRequests.length);
  }
  
  // Appliquer les filtres de plateforme d'emailing
  if (filters.emailPlatform && filters.emailPlatform.length > 0) {
    filteredRequests = filteredRequests.filter(r => {
      const platform = r.details?.emailPlatform || "Non spécifié";
      return filters.emailPlatform.includes(platform);
    });
    console.log("Après filtre emailPlatform:", filteredRequests.length);
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
