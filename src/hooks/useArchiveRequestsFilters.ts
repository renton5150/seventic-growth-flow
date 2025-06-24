
import { useState, useMemo } from "react";
import { Request } from "@/types/types";
import { sortRequests } from "@/utils/requestSorting";

export const useArchiveRequestsFilters = (requests: Request[]) => {
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [dateFilters, setDateFilters] = useState<{ [key: string]: any }>({});

  console.log("[useArchiveRequestsFilters] Hook initialisé avec", requests.length, "requêtes");

  // Extraire les valeurs uniques pour chaque colonne
  const uniqueValues = useMemo(() => {
    console.log("[useArchiveRequestsFilters] Calcul des valeurs uniques");
    
    const values = {
      type: [...new Set(requests.map(r => r.type))],
      mission: [...new Set(requests.map(r => r.missionName || "Sans mission"))],
      client: [...new Set(requests.map(r => r.missionClient || "Sans client"))],
      title: [...new Set(requests.map(r => r.title))],
      sdr: [...new Set(requests.map(r => r.sdrName || "Non assigné"))],
      assignedTo: [...new Set(requests.map(r => r.assignedToName || "Non assigné"))],
      requestType: [...new Set(requests.map(r => {
        switch(r.type) {
          case "email": return "Campagne Email";
          case "database": return "Base de données";
          case "linkedin": return "Scraping LinkedIn";
          default: return r.type;
        }
      }))],
      emailPlatform: [...new Set(requests.map(r => r.details?.emailPlatform || "Non spécifié"))],
      status: [...new Set(requests.map(r => r.workflow_status || r.status || "pending"))]
    };

    console.log("[useArchiveRequestsFilters] Valeurs uniques calculées:", values);
    return values;
  }, [requests]);

  // Appliquer les filtres et le tri
  const filteredAndSortedRequests = useMemo(() => {
    console.log("[useArchiveRequestsFilters] Application des filtres et tri");
    console.log("Filtres actifs:", filters);
    console.log("Tri:", sortColumn, sortDirection);
    
    const result = sortRequests(requests, sortColumn, sortDirection, filters, dateFilters);
    console.log("[useArchiveRequestsFilters] Résultat:", result.length, "requêtes");
    return result;
  }, [requests, sortColumn, sortDirection, filters, dateFilters]);

  const handleSort = (column: string) => {
    console.log("[useArchiveRequestsFilters] Tri demandé sur:", column);
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (column: string, values: string[]) => {
    console.log("[useArchiveRequestsFilters] Changement de filtre:", column, values);
    setFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleDateFilterChange = (field: string, type: string, values: any) => {
    console.log("[useArchiveRequestsFilters] Changement de filtre de date:", field, type, values);
    setDateFilters(prev => ({
      ...prev,
      [field]: { type, values }
    }));
  };

  return {
    filteredAndSortedRequests,
    sortColumn,
    sortDirection,
    filters,
    dateFilters,
    uniqueValues,
    handleSort,
    handleFilterChange,
    handleDateFilterChange
  };
};
