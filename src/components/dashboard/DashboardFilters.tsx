
import { useState } from "react";
import { Request } from "@/types/types";

interface DashboardFiltersProps {
  allRequests: Request[] | undefined;
  setFilterType: (filterType: string | null) => void;
}

export const DashboardFilters = ({ allRequests, setFilterType }: DashboardFiltersProps) => {
  // Filter requests based on type
  const getFilteredData = (filterType: string | null) => {
    if (!allRequests) return [];
    if (!filterType) return allRequests;
    
    return allRequests.filter(request => {
      switch (filterType) {
        case 'all':
          return true;
        case 'pending':
          return request.status === "pending" || request.workflow_status === "pending_assignment";
        case 'completed':
          return request.workflow_status === "completed";
        case 'late':
          return request.isLate;
        default:
          return true;
      }
    });
  };

  const handleFilterChange = (newFilterType: string | null) => {
    setFilterType(newFilterType);
  };

  return null; // This component only handles filter logic
};
