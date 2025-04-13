
import { useState, useEffect, useMemo } from "react";
import { useAllMissions } from "./useMissions";
import { Mission } from "@/types/types";

// Options de tri pour les missions
export type SortOptions = {
  field: "name" | "sdrName" | "startDate" | "endDate" | "status" | "type";
  direction: "asc" | "desc";
};

// Fonction de filtrage de missions
export const useMissionsList = () => {
  const { data: missions = [], isLoading, isError, error, refetch } = useAllMissions();
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<SortOptions>({ field: "startDate", direction: "desc" });
  
  // Filtres
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    startDate: null as Date | null,
    endDate: null as Date | null,
    search: "",
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
    if (filters.status !== "all") {
      result = result.filter(mission => mission.status === filters.status);
    }
    
    // Filtrer par type
    if (filters.type !== "all") {
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
  }, [missions, filters, sort]);
  
  return {
    missions: paginatedMissions,
    allMissions: missions,
    isLoading,
    isError,
    error,
    refetch,
    filters,
    setFilters,
    sort,
    setSort,
    pagination: {
      currentPage,
      pageSize,
      totalPages,
      setCurrentPage,
      setPageSize,
    },
  };
};
