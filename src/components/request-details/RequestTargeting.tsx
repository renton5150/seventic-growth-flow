
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request } from "@/types/types";

interface RequestTargetingProps {
  request: Request;
}

export const RequestTargeting: React.FC<RequestTargetingProps> = ({ request }) => {
  const renderTargetingInfo = () => {
    const targeting = request.details?.targeting || request.targeting || {};
    if (!targeting) return <p>Aucune information de ciblage disponible</p>;
    
    return (
      <div className="space-y-4">
        {targeting.jobTitles && (
          <div>
            <h3 className="text-sm font-medium mb-2">Titres de poste</h3>
            <p className="text-base">{Array.isArray(targeting.jobTitles) ? targeting.jobTitles.join(", ") : targeting.jobTitles}</p>
          </div>
        )}
        
        {targeting.industries && (
          <div>
            <h3 className="text-sm font-medium mb-2">Industries</h3>
            <p className="text-base">{Array.isArray(targeting.industries) ? targeting.industries.join(", ") : targeting.industries}</p>
          </div>
        )}
        
        {targeting.locations && (
          <div>
            <h3 className="text-sm font-medium mb-2">Localisations</h3>
            <p className="text-base">{Array.isArray(targeting.locations) ? targeting.locations.join(", ") : targeting.locations}</p>
          </div>
        )}
        
        {targeting.companySize && (
          <div>
            <h3 className="text-sm font-medium mb-2">Taille d'entreprise</h3>
            <p className="text-base">{targeting.companySize}</p>
          </div>
        )}
        
        {targeting.seniority && targeting.seniority.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Niveaux de séniorité</h3>
            <p className="text-base">{Array.isArray(targeting.seniority) ? targeting.seniority.join(", ") : targeting.seniority}</p>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ciblage</CardTitle>
      </CardHeader>
      <CardContent>
        {renderTargetingInfo()}
      </CardContent>
    </Card>
  );
};
