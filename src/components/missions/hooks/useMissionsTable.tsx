
import { useState, useMemo } from "react";
import { Mission } from "@/types/types";
import { SortColumn, SortDirection } from "../types";

export const useMissionsTable = (missions: Mission[]) => {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dateFilters, setDateFilters] = useState<{[key: string]: any}>({});
  const [nameFilter, setNameFilter] = useState<string[]>([]);
  const [sdrFilter, setSdrFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const uniqueNames = useMemo(() => [...new Set(missions.map(m => m.name))], [missions]);
  const uniqueSdrs = useMemo(() => [...new Set(missions.map(m => m.sdrName || ""))], [missions]);
  const uniqueStatuses = useMemo(() => [...new Set(missions.map(m => m.status))], [missions]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const setDateFilter = (field: string, filterType: string, values: any) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: { type: filterType, values }
    }));
  };

  const clearDateFilter = (field: string) => {
    setDateFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  };

  const filterMissionsByDate = (missionsList: Mission[]) => {
    return missionsList.filter(mission => {
      for (const [field, filter] of Object.entries(dateFilters)) {
        if (!filter.type) continue;
        
        const missionDate = mission[field as keyof Mission];
        if (!missionDate) return false;
        
        const mDate = new Date(missionDate as Date);
        
        switch (filter.type) {
          case 'equals':
            if (filter.values.date && mDate.toDateString() !== filter.values.date.toDateString()) {
              return false;
            }
            break;
          case 'before':
            if (filter.values.date && mDate >= filter.values.date) {
              return false;
            }
            break;
          case 'after':
            if (filter.values.date && mDate <= filter.values.date) {
              return false;
            }
            break;
          case 'between':
            if ((filter.values.startDate && mDate < filter.values.startDate) || 
                (filter.values.endDate && mDate > filter.values.endDate)) {
              return false;
            }
            break;
        }
      }
      return true;
    });
  };

  const sortedAndFilteredMissions = useMemo(() => {
    let result = [...missions];
    
    if (nameFilter.length > 0) {
      result = result.filter(mission => nameFilter.includes(mission.name));
    }
    if (sdrFilter.length > 0) {
      result = result.filter(mission => sdrFilter.includes(mission.sdrName || ""));
    }
    if (statusFilter.length > 0) {
      result = result.filter(mission => statusFilter.includes(mission.status));
    }
    
    result = filterMissionsByDate(result);
    
    if (sortColumn) {
      result.sort((a, b) => {
        let comparison = 0;
        
        switch (sortColumn) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'sdr':
            comparison = (a.sdrName || '').localeCompare(b.sdrName || '');
            break;
          case 'startDate':
            if (a.startDate && b.startDate) {
              comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            } else if (a.startDate) {
              comparison = -1;
            } else if (b.startDate) {
              comparison = 1;
            }
            break;
          case 'endDate':
            if (a.endDate && b.endDate) {
              comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
            } else if (a.endDate) {
              comparison = -1;
            } else if (b.endDate) {
              comparison = 1;
            }
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return result;
  }, [missions, nameFilter, sdrFilter, statusFilter, sortColumn, sortDirection, dateFilters]);

  return {
    sortColumn,
    sortDirection,
    handleSort,
    dateFilters,
    setDateFilter,
    clearDateFilter,
    nameFilter,
    setNameFilter,
    sdrFilter,
    setSdrFilter,
    statusFilter,
    setStatusFilter,
    uniqueNames,
    uniqueSdrs,
    uniqueStatuses,
    sortedAndFilteredMissions
  };
};
