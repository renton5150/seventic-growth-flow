
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
  activeTab,
  ...otherProps
}: GrowthRequestsTableProps) {
  console.log("[GrowthRequestsTable] 🔍 DIAGNOSTIC CORRIGÉ - Props reçues:");
  console.log(`  - Nombre de requests: ${requests.length}`);
  console.log(`  - Filtre actif: ${activeTab}`);
  console.log(`  - IDs des requests:`, requests.map(r => r.id));
  
  // Vérification de cohérence
  if (requests.length === 0) {
    console.warn("[GrowthRequestsTable] ⚠️ AUCUNE DEMANDE REÇUE - Le tableau sera vide!");
  } else {
    console.log("[GrowthRequestsTable] ✅ Demandes reçues correctement, transmission vers RequestsTable");
    
    // Log détaillé des premières demandes pour débug
    requests.slice(0, 3).forEach((req, index) => {
      console.log(`[GrowthRequestsTable] 📋 Request ${index + 1}:`, {
        id: req.id,
        title: req.title,
        assigned_to: req.assigned_to,
        workflow_status: req.workflow_status,
        status: req.status
      });
    });
  }
  
  return (
    <div>
      {/* DIAGNOSTIC EN TEMPS RÉEL DANS L'INTERFACE */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="text-sm text-blue-800">
          <strong>📊 Diagnostic tableau :</strong> {requests.length} demandes reçues pour le filtre "{activeTab}"
          {requests.length === 0 && (
            <span className="text-red-600 font-semibold"> - PROBLÈME : Aucune demande à afficher!</span>
          )}
        </div>
        {requests.length > 0 && (
          <div className="text-xs text-blue-600 mt-1">
            IDs: {requests.slice(0, 5).map(r => r.id.substring(0, 8)).join(', ')}
            {requests.length > 5 && `... (+${requests.length - 5} autres)`}
          </div>
        )}
      </div>
      
      <RequestsTable 
        requests={requests}
        showSdr={true}
        isSDR={false}
        onRequestDeleted={onRequestDeleted}
      />
    </div>
  );
}
