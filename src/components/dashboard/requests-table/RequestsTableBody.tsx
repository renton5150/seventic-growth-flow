
import { Request } from "@/types/types";
import { TableBody } from "@/components/ui/table";
import { RequestRow } from "./RequestRow";
import { EmptyRequestsRow } from "./EmptyRequestsRow";

interface RequestsTableBodyProps {
  sortedRequests: Request[];
  missionView?: boolean;
}

export const RequestsTableBody = ({ sortedRequests, missionView = false }: RequestsTableBodyProps) => {
  if (sortedRequests.length === 0) {
    return <EmptyRequestsRow missionView={missionView} />;
  }

  return (
    <TableBody>
      {sortedRequests.map((request) => (
        <RequestRow 
          key={request.id} 
          request={request} 
          missionView={missionView} 
        />
      ))}
    </TableBody>
  );
};
