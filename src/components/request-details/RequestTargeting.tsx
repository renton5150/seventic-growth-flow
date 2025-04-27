
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request } from "@/types/types";

interface RequestTargetingProps {
  request: Request;
}

export const RequestTargeting: React.FC<RequestTargetingProps> = ({ request }) => {
  const targeting = request.details?.targeting || {};
  
  const renderList = (items: string[] | undefined) => {
    if (!items || items.length === 0) {
      return <p className="text-muted-foreground text-sm">Non spécifié</p>;
    }
    
    return (
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-sm">{item}</li>
        ))}
      </ul>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ciblage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Industries</h3>
          {renderList(targeting.industries)}
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Taille d'entreprise</h3>
          <p className="text-sm">{targeting.companySize || "Non spécifié"}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Localisations</h3>
          {renderList(targeting.locations)}
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Titres de poste</h3>
          {renderList(targeting.jobTitles)}
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Ancienneté</h3>
          {renderList(targeting.seniority)}
        </div>
      </CardContent>
    </Card>
  );
};
