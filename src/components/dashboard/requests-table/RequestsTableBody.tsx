
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Request } from "@/types/types";
import { RequestRow } from "./RequestRow";
import { EmptyRequestsRow } from "./EmptyRequestsRow";

interface RequestsTableBodyProps {
  sortedRequests: Request[];
  missionView?: boolean;
  showSdr?: boolean;
}

export const RequestsTableBody = ({ 
  sortedRequests, 
  missionView = false,
  showSdr = false
}: RequestsTableBodyProps) => {
  return (
    <TableBody>
      {sortedRequests.length === 0 ? (
        <EmptyRequestsRow colSpan={missionView ? 5 : (showSdr ? 7 : 6)} />
      ) : (
        sortedRequests.map((request) => (
          <RequestRow 
            key={request.id} 
            request={request} 
            missionView={missionView}
            showSdr={showSdr}
          />
        ))
      )}
    </TableBody>
  );
};
