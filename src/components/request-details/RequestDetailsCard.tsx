
import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Request } from "@/types/types";

interface RequestDetailsCardProps {
  request: Request;
}

export const RequestDetailsCard: React.FC<RequestDetailsCardProps> = ({ request }) => {
  const formatDate = (date: string | Date | null) => {
    if (!date) return "Non définie";
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Détails de la demande</span>
          <Badge variant={request.status === "completed" ? "success" : "default"}>
            {request.status === "pending" ? "En attente" : 
             request.status === "in_progress" ? "En cours" : 
             request.status === "completed" ? "Terminée" : 
             request.status === "canceled" ? "Annulée" : request.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Date de création</p>
            <p>{formatDate(request.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date d'échéance</p>
            <p>{formatDate(request.due_date)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mission</p>
            <p>{request.missionName || "Non assignée"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Assigné à</p>
            <p>{request.assigned_to_name || "Non assigné"}</p>
          </div>
          {request.target_role && (
            <div>
              <p className="text-sm text-muted-foreground">Cible</p>
              <p>{request.target_role}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
