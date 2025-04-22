
import { useState, useEffect } from "react";
import { Request } from "@/types/types";
import { Table } from "@/components/ui/table";
import { RequestsTableHeader } from "./RequestsTableHeader";
import { RequestsTableBody } from "./RequestsTableBody";
import { sortRequests } from "@/utils/requestSorting";

interface RequestsTableProps {
  requests: Request[];
  missionView?: boolean;
  showSdr?: boolean;
  isSDR?: boolean;
  onRequestDeleted?: () => void;
}

export const RequestsTable = ({ 
  requests, 
  missionView = false, 
  showSdr = false,
  isSDR = false,
  onRequestDeleted
}: RequestsTableProps) => {
  const [sortColumn, setSortColumn] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<{[key: string]: string[]}>({});
  const [dateFilters, setDateFilters] = useState<{[key: string]: any}>({});
  const [uniqueValues, setUniqueValues] = useState<{[key: string]: string[]}>({
    type: [],
    title: [],
    mission: [],
    sdr: [],
    status: [],
    emailPlatform: []
  });

  // Extraire les valeurs uniques des propriétés pour les filtres
  useEffect(() => {
    const types = [...new Set(requests.map(r => r.type))];
    const missions = [...new Set(requests.map(r => r.missionName || "Sans mission").filter(Boolean))];
    const sdrs = [...new Set(requests.map(r => r.sdrName || "Non assigné"))];
    const statuses = [...new Set(requests.map(r => r.status))];
    const titles = [...new Set(requests.map(r => r.title))];
    const emailPlatforms = [...new Set(requests.map(r => {
      if (r.details && r.details.emailPlatform) {
        return r.details.emailPlatform;
      }
      return "Non spécifié";
    }))];
    
    setUniqueValues({
      type: types,
      mission: missions,
      sdr: sdrs,
      status: statuses,
      title: titles,
      emailPlatform: emailPlatforms
    });
    
    console.log("Values for filters:", {
      types,
      missions,
      sdrs,
      statuses,
      titles,
      emailPlatforms
    });
  }, [requests]);

  const filteredAndSortedRequests = sortRequests(requests, sortColumn, sortDirection, filters, dateFilters);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (column: string, values: string[]) => {
    console.log(`Applying filter on ${column}:`, values);
    setFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleDateFilterChange = (field: string, type: string, values: any) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: type ? { type, values } : undefined
    }));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <RequestsTableHeader 
          missionView={missionView} 
          handleSort={handleSort}
          showSdr={showSdr}
          isSDR={isSDR}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          filters={filters}
          dateFilters={dateFilters}
          onFilterChange={handleFilterChange}
          onDateFilterChange={handleDateFilterChange}
        />
        <RequestsTableBody 
          sortedRequests={filteredAndSortedRequests} 
          missionView={missionView}
          showSdr={showSdr}
          isSDR={isSDR}
          onRequestDeleted={onRequestDeleted}
        />
      </Table>
    </div>
  );
};
