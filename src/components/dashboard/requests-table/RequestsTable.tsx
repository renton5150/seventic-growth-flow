
import { useState } from "react";
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
