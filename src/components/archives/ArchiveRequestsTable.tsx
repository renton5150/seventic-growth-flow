
import { Request } from "@/types/types";
import { Table, TableBody } from "@/components/ui/table";
import { RequestRow } from "@/components/dashboard/requests-table/RequestRow";
import { RequestsTableHeader } from "@/components/dashboard/requests-table/RequestsTableHeader";
import { EmptyRequestsRow } from "@/components/dashboard/requests-table/EmptyRequestsRow";

interface ArchiveRequestsTableProps {
  requests: Request[];
  showSdr?: boolean;
  isSDR?: boolean;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  filters: { [key: string]: string[] };
  dateFilters: { [key: string]: any };
  uniqueValues: { [key: string]: string[] };
  onSort: (column: string) => void;
  onFilterChange: (column: string, values: string[]) => void;
  onDateFilterChange: (field: string, type: string, values: any) => void;
}

export const ArchiveRequestsTable = ({
  requests,
  showSdr = false,
  isSDR = false,
  sortColumn,
  sortDirection,
  filters,
  dateFilters,
  uniqueValues,
  onSort,
  onFilterChange,
  onDateFilterChange
}: ArchiveRequestsTableProps) => {
  console.log("[ArchiveRequestsTable] Rendu avec", requests.length, "requêtes");

  if (!requests || requests.length === 0) {
    return <EmptyRequestsRow colSpan={11} />;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <RequestsTableHeader
          handleSort={onSort}
          showSdr={showSdr}
          isSDR={isSDR}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          filters={filters}
          dateFilters={dateFilters}
          onFilterChange={onFilterChange}
          onDateFilterChange={onDateFilterChange}
          uniqueValues={uniqueValues}
        />
        <TableBody>
          {requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              showSdr={showSdr}
              isSDR={isSDR}
              isArchived={true}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
