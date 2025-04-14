
import { useState, useEffect, useMemo } from "react";
import { useAllMissions } from "./useMissions";
import { Mission, MissionStatus, MissionType } from "@/types/types";

// Options de tri pour les missions
export type SortField = "name" | "sdrName" | "startDate" | "endDate" | "status" | "type";
export type SortDirection = "asc" | "desc";

export type SortOptions = {
  field: SortField;
  direction: SortDirection;
};

// Type pour les filtres de missions
export type MissionFilters = {
  status?: MissionStatus | undefined;
  type?: MissionType | undefined;
  startDate?: Date | null;
  endDate?: Date | null;
  search?: string;
};

// Fonction de filtrage de missions
export const useMissionsList = () => {
  const { data: missionsData = [], isLoading, isError, error, refetch } = useAllMissions();
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<SortOptions>({ field: "startDate", direction: "desc" });
  
  // Filtres
  const [filters, setFilters] = useState<MissionFilters>({
    status: undefined,
    type: undefined,
    startDate: null,
    endDate: null,
    search: undefined,
  });
  
  // Pagination
  const paginatedMissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredMissions.slice(start, end);
  }, [filteredMissions, currentPage, pageSize]);

  const totalPages = useMemo(
    () => Math.ceil(filteredMissions.length / pageSize),
    [filteredMissions.length, pageSize]
  );

  // Appliquer filtrage et tri
  useEffect(() => {
    // Ensure missionsData is treated as Mission[] and not Mission[][]
    let missions: Mission[] = [];
    
    // Make sure we're working with a proper Mission array
    if (Array.isArray(missionsData)) {
      // If it's an array of arrays, flatten it
      if (missionsData.length > 0 && Array.isArray(missionsData[0])) {
        // Flatten array of arrays
        missions = (missionsData as unknown as Mission[][]).flat();
      } else {
        // It's already a simple array
        missions = missionsData as Mission[];
      }
    }

    let result = [...missions];
    
    // Filtrer par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (mission) =>
          mission.name.toLowerCase().includes(searchLower) ||
          (mission.description?.toLowerCase().includes(searchLower)) ||
          (mission.sdrName?.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtrer par status
    if (filters.status) {
      result = result.filter(mission => mission.status === filters.status);
    }
    
    // Filtrer par type
    if (filters.type) {
      result = result.filter(mission => mission.type === filters.type);
    }
    
    // Filtrer par date de début
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(
        mission => mission.startDate && new Date(mission.startDate) >= startDate
      );
    }
    
    // Filtrer par date de fin
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      result = result.filter(
        mission => mission.endDate && new Date(mission.endDate) <= endDate
      );
    }
    
    // Appliquer le tri
    result.sort((a, b) => {
      let valueA: any = a[sort.field];
      let valueB: any = b[sort.field];
      
      // Gestion spéciale pour les dates
      if (sort.field === "startDate" || sort.field === "endDate") {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      }
      
      // Tri ascendant ou descendant
      if (sort.direction === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredMissions(result);
    // Retourner à la première page lors du changement de filtre
    setCurrentPage(1);
  }, [missionsData, filters, sort]);
  
  // Fonctions pour la pagination
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  // Fonction pour mettre à jour les filtres
  const updateFilters = (newFilters: Partial<MissionFilters>) => {
    setFilters(current => ({
      ...current,
      ...newFilters,
    }));
  };
  
  // Fonction pour mettre à jour le tri
  const updateSort = (field: SortField) => {
    setSort(current => {
      if (current.field === field) {
        // Inverser la direction si on clique sur la même colonne
        return {
          field,
          direction: current.direction === "asc" ? "desc" : "asc"
        };
      }
      // Nouvelle colonne, direction par défaut : desc
      return {
        field,
        direction: "desc"
      };
    });
  };
  
  return {
    missions: paginatedMissions,
    allMissions: Array.isArray(missionsData) ? 
      (Array.isArray(missionsData[0]) ? 
        (missionsData as unknown as Mission[][]).flat() : 
        missionsData as Mission[]) : 
      [],
    isLoading,
    isError,
    error,
    refetch,
    filters,
    updateFilters,
    sort,
    setSort,
    updateSort,
    pagination: {
      currentPage,
      pageSize,
      totalPages,
      totalItems: filteredMissions.length,
      setCurrentPage,
      setPageSize,
      goToPage,
      nextPage,
      prevPage,
    },
  };
};
