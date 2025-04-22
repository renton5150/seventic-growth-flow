import { Request } from "@/types/types";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { RequestTypeIcon } from "./RequestTypeIcon";
import { RequestStatusBadge } from "./RequestStatusBadge";

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
          <TableRow key={request.id}>
            <TableCell>
              <RequestTypeIcon type={request.type} />
            </TableCell>
            <TableCell>{request.title}</TableCell>
            <TableCell>{request.missionName || "Sans mission"}</TableCell>
            {showSdr && <TableCell>{request.sdrName || "Non assigné"}</TableCell>}
            <TableCell>
              <RequestStatusBadge status={request.workflow_status || request.status} isLate={request.isLate} />
            </TableCell>
            <TableCell>
              {/* Due date */}
              {/* ... */}
            </TableCell>
            <TableCell>
              {/* Created at */}
              {/* ... */}
            </TableCell>
            {/* Nouvelle colonne: Plateforme d'emailing si disponible */}
            <TableCell>
              {request.type === "email"
                ? request.details?.emailPlatform || "–"
                : "–"}
            </TableCell>
            <TableCell className="text-right">
              {/*
                Actions (Edit, Delete, etc.)
                ... keep existing code for actions ...
              */}
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  );
};
