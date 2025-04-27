
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request } from "@/types/types";

interface EmailCampaignDetailsProps {
  request: Request;
}

export const EmailCampaignDetails: React.FC<EmailCampaignDetailsProps> = ({ request }) => {
  const details = request.details || {};
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails de la campagne email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Titre</h3>
          <p className="text-base">{details.title || request.title}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Sujet</h3>
          <p className="text-base">{details.subject || "Non spécifié"}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Audience cible</h3>
          <p className="text-base">{details.targetAudience || "Non spécifiée"}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Call to action</h3>
          <p className="text-base">{details.callToAction || "Non spécifié"}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Objectifs</h3>
          <p className="text-base">{details.objectives || "Non spécifiés"}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Contenu</h3>
          <div className="border rounded-md p-4 bg-secondary/10">
            <p className="text-base whitespace-pre-wrap">{details.content || "Aucun contenu spécifié"}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Notes additionnelles</h3>
          <p className="text-base">{details.additionalNotes || "Aucune note additionnelle"}</p>
        </div>
      </CardContent>
    </Card>
  );
};
