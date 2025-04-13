
import { useState, useMemo } from "react";
import { useAllMissions, useUserMissions } from "@/hooks/useMissions";
import { Mission, MissionStatus, MissionType } from "@/types/types";

// Interface pour les filtres de mission
export interface MissionFilters {
  status?: MissionStatus;
  type?: MissionType;
  search?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

// Options de tri pour les missions
export type MissionSortField = "name" | "type" | "sdrName" | "status" | "startDate" | "endDate";
export type SortDirection = "asc" | "desc";

export interface MissionSortOptions {
  field: MissionSortField;
  direction: SortDirection;
}

// Options pour la pagination
export interface PaginationOptions {
  pageSize: number;
  currentPage: number;
}

// Hook personnalisé pour la liste des missions avec filtrage, tri et pagination
export const useMissionsList = (userId?: string, isAdmin = false) => {
  // État pour les filtres
  const [filters, setFilters] = useState<MissionFilters>({});
  
  // État pour les options de tri
  const [sortOptions, setSortOptions] = useState<MissionSortOptions>({
    field: "name",
    direction: "asc"
  });
  
  // État pour la pagination
  const [pagination, setPagination] = useState<PaginationOptions>({
    pageSize: 10,
    currentPage: 1
  });

  // Récupération des missions selon le rôle utilisateur
  const missionsQuery = isAdmin 
    ? useAllMissions(filters) 
    : useUserMissions(userId);
  
  // Extraire les données et l'état
  const { data: missions = [], isLoading, isError, error, refetch } = missionsQuery;
  
  // Filtrage côté client pour les critères complexes
  const filteredMissions = useMemo(() => {
    if (!missions.length) return [];
    
    return missions.filter(mission => {
      // Filtre par recherche textuelle
      if (filters.search && 
          !mission.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(mission.sdrName && mission.sdrName.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false;
      }
      
      // Filtre par statut
      if (filters.status && mission.status !== filters.status) {
        return false;
      }
      
      // Filtre par type
      if (filters.type && mission.type !== filters.type) {
        return false;
      }
      
      // Filtre par date de début
      if (filters.startDate && mission.startDate && 
          new Date(mission.startDate) < filters.startDate) {
        return false;
      }
      
      // Filtre par date de fin
      if (filters.endDate && mission.endDate && 
          new Date(mission.endDate) > filters.endDate) {
        return false;
      }
      
      return true;
    });
  }, [missions, filters]);
  
  // Tri des missions filtrées
  const sortedMissions = useMemo(() => {
    if (!filteredMissions.length) return [];
    
    return [...filteredMissions].sort((a, b) => {
      const { field, direction } = sortOptions;
      const multiplier = direction === "asc" ? 1 : -1;
      
      switch (field) {
        case "name":
          return multiplier * a.name.localeCompare(b.name);
        case "type":
          return multiplier * a.type.localeCompare(b.type);
        case "status":
          return multiplier * a.status.localeCompare(b.status);
        case "sdrName":
          const aName = a.sdrName || "";
          const bName = b.sdrName || "";
          return multiplier * aName.localeCompare(bName);
        case "startDate":
          const aStartDate = a.startDate ? new Date(a.startDate).getTime() : 0;
          const bStartDate = b.startDate ? new Date(b.startDate).getTime() : 0;
          return multiplier * (aStartDate - bStartDate);
        case "endDate":
          const aEndDate = a.endDate ? new Date(a.endDate).getTime() : 0;
          const bEndDate = b.endDate ? new Date(b.endDate).getTime() : 0;
          return multiplier * (aEndDate - bEndDate);
        default:
          return 0;
      }
    });
  }, [filteredMissions, sortOptions]);
  
  // Pagination des résultats
  const paginatedMissions = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    return sortedMissions.slice(startIndex, startIndex + pagination.pageSize);
  }, [sortedMissions, pagination]);
  
  // Total des pages
  const totalPages = useMemo(() => {
    return Math.ceil(sortedMissions.length / pagination.pageSize);
  }, [sortedMissions.length, pagination.pageSize]);
  
  // Changement de page
  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };
  
  // Navigation entre les pages
  const nextPage = () => {
    if (pagination.currentPage < totalPages) {
      goToPage(pagination.currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (pagination.currentPage > 1) {
      goToPage(pagination.currentPage - 1);
    }
  };
  
  // Modification des filtres
  const updateFilters = (newFilters: Partial<MissionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));  // Reset to first page
  };
  
  // Modification du tri
  const updateSort = (field: MissionSortField) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };
  
  // Modification de la taille de page
  const setPageSize = (size: number) => {
    setPagination({ currentPage: 1, pageSize: size });
  };
  
  return {
    missions: paginatedMissions,
    allMissions: missions,
    isLoading,
    isError,
    error,
    refetch,
    filters,
    updateFilters,
    sortOptions,
    updateSort,
    pagination: {
      ...pagination,
      totalPages,
      totalItems: sortedMissions.length,
      goToPage,
      nextPage,
      prevPage,
      setPageSize
    }
  };
};
