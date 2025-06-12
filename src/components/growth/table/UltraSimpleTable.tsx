
import { SimpleRequest } from "@/services/requests/simpleRequestService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface UltraSimpleTableProps {
  requests: SimpleRequest[];
}

export const UltraSimpleTable = ({ requests }: UltraSimpleTableProps) => {
  console.log("[UltraSimpleTable] 🎯 Affichage de", requests.length, "demandes");
  
  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune demande trouvée</p>
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
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
          {requests.map((request) => (
            <TableRow key={request.id}>
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
                  {formatDistanceToNow(new Date(request.due_date), {
                    addSuffix: true,
                    locale: fr
                  })}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
