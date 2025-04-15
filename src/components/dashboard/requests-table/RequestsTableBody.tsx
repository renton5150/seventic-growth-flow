
import { TableBody } from "@/components/ui/table";
import { Request } from "@/types/types";
import { RequestRow } from "./RequestRow";
import { EmptyRequestsRow } from "./EmptyRequestsRow";

interface RequestsTableBodyProps {
  sortedRequests: Request[];
  missionView?: boolean;
  showSdr?: boolean;
}

export const RequestsTableBody = ({ sortedRequests, missionView = false, showSdr = false }: RequestsTableBodyProps) => {
  if (sortedRequests.length === 0) {
    return (
      <TableBody>
        <EmptyRequestsRow colSpan={missionView ? 7 : (showSdr ? 9 : 8)} />
      </TableBody>
    );
  }

  return (
    <TableBody>
      {sortedRequests.map((request) => (
        <RequestRow
          key={request.id}
          request={request}
          missionView={missionView}
          showSdr={showSdr}
        />
      ))}
    </TableBody>
  );
};
