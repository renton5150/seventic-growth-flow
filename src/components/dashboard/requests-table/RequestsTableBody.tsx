
import { TableBody } from "@/components/ui/table";
import { RequestRow } from "./RequestRow";
import { EmptyRequestsRow } from "./EmptyRequestsRow";
import { Request } from "@/types/types";

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
  if (sortedRequests.length === 0) {
    return <EmptyRequestsRow colSpan={isSDR ? 8 : 8} />;
  }

  return (
    <TableBody>
      {sortedRequests.map((request) => (
        <RequestRow
          key={request.id}
          request={request}
          missionView={missionView}
          showSdr={showSdr}
          isSDR={isSDR}
          onDeleted={onRequestDeleted}
        />
      ))}
    </TableBody>
  );
};
