
import { TableCell, TableRow } from "@/components/ui/table";
import { Request } from "@/types/types";
import { columns } from "./columns";
import { GrowthRequestActions } from "./GrowthRequestActions";
import { useAuth } from "@/contexts/AuthContext";

interface GrowthTableRowProps {
  request: Request;
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails: (request: Request) => void;
  onRequestDeleted?: () => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

export function GrowthTableRow({
  request,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  onRequestDeleted,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab
}: GrowthTableRowProps) {
  const { user } = useAuth();
  const showDeleteButton = user?.role === "admin" || user?.role === "growth" || 
                           (user?.role === "sdr" && user?.id === request.createdBy);

  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell key={column.key} className={column.key === "mission" ? "font-medium" : ""}>
          {column.render(request)}
        </TableCell>
      ))}
      <TableCell className="text-right">
        <GrowthRequestActions
          request={request}
          onEditRequest={onEditRequest}
          onCompleteRequest={onCompleteRequest}
          onViewDetails={onViewDetails}
          onRequestDeleted={onRequestDeleted}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          activeTab={activeTab}
          showDeleteButton={showDeleteButton}
        />
      </TableCell>
    </TableRow>
  );
}
