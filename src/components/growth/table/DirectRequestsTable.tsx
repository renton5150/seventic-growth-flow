
import { DirectRequest } from "@/services/requests/directRequestService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DirectRequestsTableProps {
  requests: DirectRequest[];
}

export const DirectRequestsTable = ({ requests }: DirectRequestsTableProps) => {
  console.log("🔍 [DIRECT-TABLE] DirectRequestsTable rendu avec:", requests.length, "demandes");
  console.log("🔍 [DIRECT-TABLE] requests IDs:", requests.map(r => r.id));
  
  if (requests.length === 0) {
    console.warn("⚠️ [DIRECT-TABLE] DirectRequestsTable: tableau vide");
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">❌ DIRECT: Tableau vide</p>
          <p className="text-red-600 text-sm">Le composant tableau direct a reçu 0 demandes à afficher</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, workflowStatus: string, isLate: boolean) => {
    if (isLate) {
      return <Badge variant="destructive">En retard</Badge>;
    }
    
    switch (workflowStatus) {
      case 'pending_assignment':
        return <Badge variant="outline" className="bg-orange-500 text-white">En attente d'assignation</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-500 text-white">En cours</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500 text-white">Terminée</Badge>;
      default:
        return <Badge variant="outline">{workflowStatus}</Badge>;
    }
  };

  console.log("✅ [DIRECT-TABLE] DirectRequestsTable: rendu du tableau avec", requests.length, "lignes");

  return (
    <div className="rounded-md border">
      {/* Indicateur de succès DIRECT */}
      <div className="bg-blue-50 border-b border-blue-200 p-2">
        <div className="text-blue-800 text-sm font-semibold">
          🚀 DIRECT: Tableau affiché avec {requests.length} demande(s) (récupération directe)
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID (debug)</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Mission</TableHead>
            <TableHead>SDR</TableHead>
            <TableHead>Assigné à</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Échéance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request, index) => {
            console.log(`🔍 [DIRECT-TABLE] Rendu ligne ${index + 1}:`, request.id, request.title);
            
            return (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="text-xs text-gray-500 font-mono">
                    {request.id.substring(0, 8)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{request.type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{request.title}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{request.mission_name}</div>
                  {request.mission_client && (
                    <div className="text-sm text-gray-500">{request.mission_client}</div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{request.sdr_name}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {request.assigned_to_name || (
                      <Badge variant="outline" className="text-orange-600">
                        Non assigné
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(request.status, request.workflow_status, request.isLate)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {request.due_date ? formatDistanceToNow(new Date(request.due_date), {
                      addSuffix: true,
                      locale: fr
                    }) : 'Pas de date'}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
