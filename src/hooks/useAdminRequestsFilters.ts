
import { useState, useMemo } from "react";
import { sortRequests } from "@/utils/requestSorting";
import { RequestStatus, WorkflowStatus } from "@/types/types";

interface SimpleRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  workflow_status: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  due_date: string;
  mission_id: string | null;
}

export const useAdminRequestsFilters = (
  requests: SimpleRequest[],
  userProfiles: {[key: string]: string}, 
  missionNames: {[key: string]: string}
) => {
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [dateFilters, setDateFilters] = useState<{ [key: string]: any }>({});

  console.log("[useAdminRequestsFilters] Hook initialisé avec", requests.length, "requêtes");

  // Extraire les valeurs uniques pour chaque colonne
  const uniqueValues = useMemo(() => {
    console.log("[useAdminRequestsFilters] Calcul des valeurs uniques");
    
    const values = {
      type: [...new Set(requests.map(r => r.type))],
      mission: [...new Set(requests.map(r => r.mission_id ? missionNames[r.mission_id] || 'Mission inconnue' : 'Non assignée'))],
      createdBy: [...new Set(requests.map(r => userProfiles[r.created_by] || 'Inconnu'))],
      assignedTo: [...new Set(requests.map(r => r.assigned_to ? userProfiles[r.assigned_to] || 'Inconnu' : 'Non assigné'))],
      status: [...new Set(requests.map(r => r.workflow_status))]
    };

    console.log("[useAdminRequestsFilters] Valeurs uniques calculées:", values);
    return values;
  }, [requests, userProfiles, missionNames]);

  // Convertir les SimpleRequest vers le format attendu par sortRequests (format Request)
  const convertedRequests = useMemo(() => {
    return requests.map(request => ({
      id: request.id,
      title: request.title,
      type: request.type,
      status: request.status as RequestStatus,
      workflow_status: request.workflow_status as WorkflowStatus,
      createdBy: request.created_by, // Conversion snake_case vers camelCase
      assignedToName: request.assigned_to ? userProfiles[request.assigned_to] || 'Inconnu' : 'Non assigné',
      assigned_to: request.assigned_to,
      createdAt: new Date(request.created_at), // Conversion en Date
      dueDate: request.due_date, // Garder comme string pour compatibility
      missionId: request.mission_id, // Conversion snake_case vers camelCase
      missionName: request.mission_id ? missionNames[request.mission_id] || 'Mission inconnue' : 'Non assignée',
      missionClient: request.mission_id ? missionNames[request.mission_id] || 'Mission inconnue' : 'Non assignée', // Simplifié pour ce cas
      sdrName: userProfiles[request.created_by] || 'Inconnu',
      details: {}, // Objet vide pour satisfaire l'interface
      isLate: false, // Valeur par défaut
      lastUpdated: new Date(request.created_at), // Valeur par défaut
      target_role: 'growth' // Valeur par défaut
    }));
  }, [requests, userProfiles, missionNames]);

  // Appliquer les filtres et le tri
  const filteredAndSortedRequests = useMemo(() => {
    console.log("[useAdminRequestsFilters] Application des filtres et tri");
    console.log("Filtres actifs:", filters);
    console.log("Filtres de date:", dateFilters);
    console.log("Tri:", sortColumn, sortDirection);
    
    const result = sortRequests(convertedRequests, sortColumn, sortDirection, filters, dateFilters);
    console.log("[useAdminRequestsFilters] Résultat:", result.length, "requêtes");
    return result;
  }, [convertedRequests, sortColumn, sortDirection, filters, dateFilters]);

  const handleSort = (column: string) => {
    console.log("[useAdminRequestsFilters] Tri demandé sur:", column);
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (column: string, values: string[]) => {
    console.log("[useAdminRequestsFilters] Changement de filtre:", column, values);
    setFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleDateFilterChange = (field: string, type: string | null, values: any) => {
    console.log("[useAdminRequestsFilters] Changement de filtre de date:", field, type, values);
    setDateFilters(prev => {
      if (type === null) {
        const newFilters = { ...prev };
        delete newFilters[field];
        return newFilters;
      }
      return {
        ...prev,
        [field]: { type, values }
      };
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setDateFilters({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => filters[key]?.length > 0) || 
                          Object.keys(dateFilters).length > 0;

  return {
    filteredAndSortedRequests,
    sortColumn,
    sortDirection,
    filters,
    dateFilters,
    uniqueValues,
    handleSort,
    handleFilterChange,
    handleDateFilterChange,
    clearAllFilters,
    hasActiveFilters
  };
};
