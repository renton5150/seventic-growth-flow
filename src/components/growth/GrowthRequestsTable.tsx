
import { Request } from "@/types/types";
import { RequestsTable } from "../dashboard/requests-table/RequestsTable";

interface GrowthRequestsTableProps {
  requests: Request[];
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails: (request: Request) => void;
  onRequestUpdated: () => void;
  onRequestDeleted?: () => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

export function GrowthRequestsTable({
  requests,
  onRequestDeleted,
  ...otherProps
}: GrowthRequestsTableProps) {
  console.log("[GrowthRequestsTable] Utilisation du RequestsTable SDR qui fonctionne pour les missions");
  
  return (
    <RequestsTable 
      requests={requests}
      showSdr={true}
      isSDR={false}
      onRequestDeleted={onRequestDeleted}
    />
  );
}
