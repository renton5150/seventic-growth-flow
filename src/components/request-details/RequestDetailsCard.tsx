
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
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Titre</h3>
          <p className="text-base">{request.title}</p>
        </div>
        
        {request.details?.description && (
          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-base">{request.details.description}</p>
          </div>
        )}
        
        {request.details?.additionalNotes && (
          <div>
            <h3 className="text-sm font-medium mb-2">Notes additionnelles</h3>
            <p className="text-base">{request.details.additionalNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
