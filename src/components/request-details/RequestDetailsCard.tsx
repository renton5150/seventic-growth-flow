
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request } from "@/types/types";

interface RequestDetailsCardProps {
  request: Request;
}

export const RequestDetailsCard: React.FC<RequestDetailsCardProps> = ({ request }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails de la demande</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Titre</p>
            <p className="text-base">{request.title}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Type</p>
            <p className="text-base capitalize">{request.type}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Statut</p>
            <p className="text-base capitalize">{request.status}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date d'échéance</p>
            <p className="text-base">
              {request.due_date 
                ? new Date(request.due_date).toLocaleDateString() 
                : "Non définie"}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Mission</p>
            <p className="text-base">{request.missionName || "Non assignée"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
