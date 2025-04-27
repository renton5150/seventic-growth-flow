
import React from 'react';
import { Request, DatabaseRequest, LinkedInScrapingRequest } from '@/types/types';

interface RequestTargetingProps {
  request: Request;
}

export const RequestTargeting: React.FC<RequestTargetingProps> = ({ request }) => {
  // Access targeting based on request type
  const getTargeting = () => {
    if (request.type === 'database') {
      // Try to access targeting from different possible locations based on the data structure
      return (request as DatabaseRequest).details?.targeting || request.targeting;
    } else if (request.type === 'linkedin') {
      // Try to access targeting from different possible locations based on the data structure
      return (request as LinkedInScrapingRequest).details?.targeting || request.targeting;
    }
    return null;
  };

  const targeting = getTargeting();

  if (!targeting) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Aucune information de ciblage disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {targeting.jobTitles && targeting.jobTitles.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Titres de poste</h3>
          <ul className="list-disc pl-5">
            {targeting.jobTitles.map((title: string, index: number) => (
              <li key={index}>{title}</li>
            ))}
          </ul>
        </div>
      )}

      {targeting.industries && targeting.industries.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Industries</h3>
          <ul className="list-disc pl-5">
            {targeting.industries.map((industry: string, index: number) => (
              <li key={index}>{industry}</li>
            ))}
          </ul>
        </div>
      )}

      {targeting.locations && targeting.locations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Localisations</h3>
          <ul className="list-disc pl-5">
            {targeting.locations.map((location: string, index: number) => (
              <li key={index}>{location}</li>
            ))}
          </ul>
        </div>
      )}

      {targeting.companySize && (
        <div>
          <h3 className="text-lg font-medium mb-2">Taille d'entreprise</h3>
          {Array.isArray(targeting.companySize) ? (
            <ul className="list-disc pl-5">
              {targeting.companySize.map((size: string, index: number) => (
                <li key={index}>{size}</li>
              ))}
            </ul>
          ) : (
            <p>{targeting.companySize}</p>
          )}
        </div>
      )}

      {targeting.otherCriteria && (
        <div>
          <h3 className="text-lg font-medium mb-2">Autres critères</h3>
          <p>{targeting.otherCriteria}</p>
        </div>
      )}
    </div>
  );
};
