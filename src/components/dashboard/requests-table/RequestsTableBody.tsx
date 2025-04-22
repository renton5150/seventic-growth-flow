
import { Request } from "@/types/types";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { RequestTypeIcon } from "./RequestTypeIcon";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { RequestRow } from "./RequestRow";

export const RequestsTableBody = ({
  sortedRequests,
  missionView = false,
  showSdr = false,
  isSDR = false,
  onRequestDeleted,
}: {
  sortedRequests: Request[];
  missionView?: boolean;
  showSdr?: boolean;
  isSDR?: boolean;
  onRequestDeleted?: () => void;
}) => {
  return (
    <TableBody>
      {sortedRequests.length === 0 ? (
        <TableRow>
          <TableCell colSpan={9} className="text-center py-8">
            Aucune demande trouvée.
          </TableCell>
        </TableRow>
      ) : (
        sortedRequests.map((request) => (
          <RequestRow 
            key={request.id} 
            request={request} 
            missionView={missionView} 
            showSdr={showSdr} 
            isSDR={isSDR}
            onDeleted={onRequestDeleted}
          />
        ))
      )}
    </TableBody>
  );
};
