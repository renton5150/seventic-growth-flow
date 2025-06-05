
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
  console.log("[GrowthRequestsTable] 🔍 DIAGNOSTIC OPTIMISÉ - Requests reçues:", requests.length);
  
  // Log détaillé pour le débogage des missions
  const requestsWithMissions = requests.filter(r => r.missionName !== "Sans mission");
  const requestsWithoutMissions = requests.filter(r => r.missionName === "Sans mission");
  
  console.log(`[GrowthRequestsTable] 📊 RÉSUMÉ MISSIONS:`);
  console.log(`  ✅ Avec missions: ${requestsWithMissions.length}`);
  console.log(`  ❌ Sans missions: ${requestsWithoutMissions.length}`);
  
  if (requestsWithMissions.length > 0) {
    console.log("[GrowthRequestsTable] 🎯 Exemples avec missions:", 
      requestsWithMissions.slice(0, 3).map(r => ({ 
        id: r.id, 
        title: r.title,
        missionId: r.missionId,
        missionName: r.missionName, 
        missionClient: r.missionClient 
      }))
    );
  }
  
  if (requestsWithoutMissions.length > 0) {
    console.log("[GrowthRequestsTable] ⚠️ Exemples sans missions:", 
      requestsWithoutMissions.slice(0, 3).map(r => ({ 
        id: r.id, 
        title: r.title,
        missionId: r.missionId 
      }))
    );
  }
  
  return (
    <RequestsTable 
      requests={requests}
      showSdr={true}
      isSDR={false}
      onRequestDeleted={onRequestDeleted}
    />
  );
}
