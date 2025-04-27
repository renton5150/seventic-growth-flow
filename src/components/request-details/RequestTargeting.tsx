
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request } from "@/types/types";

interface RequestTargetingProps {
  request: Request;
}

export const RequestTargeting: React.FC<RequestTargetingProps> = ({ request }) => {
  const renderTargetingContent = () => {
    if (!request.details) return <p>Aucune information de ciblage disponible</p>;
    
    if (request.type === "database") {
      const targeting = request.details.targeting || {};
      return (
        <div className="space-y-4">
          {targeting.industries && targeting.industries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium">Industries</h4>
              <ul className="list-disc pl-5 mt-1">
                {targeting.industries.map((industry: string, i: number) => (
                  <li key={i}>{industry}</li>
                ))}
              </ul>
            </div>
          )}
          
          {targeting.companySize && (
            <div>
              <h4 className="text-sm font-medium">Taille d'entreprise</h4>
              <p>{targeting.companySize}</p>
            </div>
          )}
          
          {targeting.locations && targeting.locations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium">Localisation</h4>
              <ul className="list-disc pl-5 mt-1">
                {targeting.locations.map((location: string, i: number) => (
                  <li key={i}>{location}</li>
                ))}
              </ul>
            </div>
          )}
          
          {request.target_role && (
            <div>
              <h4 className="text-sm font-medium">Fonction cible</h4>
              <p>{request.target_role}</p>
            </div>
          )}
        </div>
      );
    }
    
    return <p>Aucune information de ciblage disponible pour ce type de demande</p>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ciblage</CardTitle>
      </CardHeader>
      <CardContent>
        {renderTargetingContent()}
      </CardContent>
    </Card>
  );
};
