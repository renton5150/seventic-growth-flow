
import { useState } from "react";
import { Request } from "@/types/types";
import { RequestsTableHeader } from "./RequestsTableHeader";
import { RequestsTableBody } from "./RequestsTableBody";
import { Table } from "@/components/ui/table";

interface RequestsTableProps {
  requests: Request[];
  missionView?: boolean;
  showSdr?: boolean;
}

export const RequestsTable = ({ requests, missionView = false, showSdr = false }: RequestsTableProps) => {
  const [sortColumn, setSortColumn] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedRequests = [...requests].sort((a, b) => {
    switch (sortColumn) {
      case "dueDate":
        return sortDirection === "asc" 
          ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      case "title":
        return sortDirection === "asc" 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      case "status":
        return sortDirection === "asc" 
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      case "type":
        return sortDirection === "asc" 
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      case "sdrName":
        return sortDirection === "asc" 
          ? (a.sdrName || "").localeCompare(b.sdrName || "")
          : (b.sdrName || "").localeCompare(a.sdrName || "");
      default:
        return 0;
    }
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <RequestsTableHeader 
          missionView={missionView} 
          handleSort={handleSort}
          showSdr={showSdr}
        />
        <RequestsTableBody 
          sortedRequests={sortedRequests} 
          missionView={missionView}
          showSdr={showSdr}
        />
      </Table>
    </div>
  );
};
