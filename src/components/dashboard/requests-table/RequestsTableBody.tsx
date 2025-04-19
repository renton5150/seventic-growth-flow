
import { TableBody } from "@/components/ui/table";
import { Request } from "@/types/types";
import { EmptyRequestsRow } from "./EmptyRequestsRow";
import { RequestRow } from "./RequestRow";

interface RequestsTableBodyProps {
  sortedRequests: Request[];
  missionView?: boolean;
  showSdr?: boolean;
  isSDR?: boolean;
  onRequestDeleted?: () => void;
}

export const RequestsTableBody = ({ 
  sortedRequests, 
  missionView = false,
  showSdr = false,
  isSDR = false,
  onRequestDeleted
}: RequestsTableBodyProps) => {
  return (
    <TableBody>
      {sortedRequests.length === 0 ? (
        <EmptyRequestsRow colSpan={missionView ? 6 : (isSDR ? 6 : 7)} />
      ) : (
        sortedRequests.map((request) => (
          <RequestRow 
            key={request.id} 
            request={request} 
            missionView={missionView}
            showSdr={showSdr}
            isSDR={isSDR}
            onRequestDeleted={onRequestDeleted}
          />
        ))
      )}
    </TableBody>
  );
};
