
import { Request } from "@/types/types";
import { SimpleRequestsTable } from "./table/SimpleRequestsTable";

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
  activeTab,
  ...otherProps
}: GrowthRequestsTableProps) {
  console.log("[GrowthRequestsTable] ✅ NOUVEAU SYSTÈME - Données reçues:");
  console.log(`  - Nombre de requests: ${requests.length}`);
  console.log(`  - Filtre actif: ${activeTab}`);
  console.log(`  - IDs des requests:`, requests.map(r => r.id.substring(0, 8)));
  
  return (
    <div>
      {/* DIAGNOSTIC SIMPLIFIÉ */}
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
        <div className="text-sm text-green-800">
          <strong>✅ Nouveau système :</strong> {requests.length} demandes transmises directement au tableau
        </div>
        {requests.length > 0 && (
          <div className="text-xs text-green-600 mt-1">
            Premier ID: {requests[0]?.id?.substring(0, 8)} | Dernier ID: {requests[requests.length - 1]?.id?.substring(0, 8)}
          </div>
        )}
      </div>
      
      <SimpleRequestsTable 
        requests={requests}
        onRequestDeleted={onRequestDeleted}
        {...otherProps}
      />
    </div>
  );
}
