
import { TableCell, TableRow } from "@/components/ui/table";
import { Request } from "@/types/types";
import { columns } from "./columns";
import { GrowthRequestActions } from "./GrowthRequestActions";

interface GrowthTableRowProps {
  request: Request;
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails: (request: Request) => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

export function GrowthTableRow({
  request,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab
}: GrowthTableRowProps) {
  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell key={column.key} className="text-center">
          {column.render(request)}
        </TableCell>
      ))}
      <TableCell className="text-right">
        <GrowthRequestActions
          request={request}
          onEditRequest={onEditRequest}
          onCompleteRequest={onCompleteRequest}
          onViewDetails={onViewDetails}
          assignRequestToMe={assignRequestToMe}
          updateRequestWorkflowStatus={updateRequestWorkflowStatus}
          activeTab={activeTab}
        />
      </TableCell>
    </TableRow>
  );
}
