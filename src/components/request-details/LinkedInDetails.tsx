
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkedInScrapingRequest } from '@/types/types';

interface LinkedInDetailsProps {
  request: LinkedInScrapingRequest;
}

export const LinkedInDetails = ({ request }: LinkedInDetailsProps) => {
  const targeting = request.targeting || {
    jobTitles: [],
    industries: [],
    locations: [],
    companySize: [],
    otherCriteria: ""
  };
  const profilesScraped = request.profilesScraped || 0;
  const resultFileUrl = request.resultFileUrl || "";

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Résultats</CardTitle>
        </CardHeader>
        <CardContent>
          {profilesScraped > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm">Profils récupérés</h4>
              <p>{profilesScraped}</p>
            </div>
          )}
          {resultFileUrl && (
            <div>
              <h4 className="font-semibold text-sm">Fichier de résultats</h4>
              <a href={resultFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                Télécharger les résultats
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <TargetingSection targeting={targeting} />
    </>
  );
};

interface TargetingSectionProps {
  targeting: {
    jobTitles: string[];
    industries: string[];
    locations?: string[];
    companySize: string[];
    otherCriteria?: string;
  };
}

const TargetingSection = ({ targeting }: TargetingSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Critères de ciblage</CardTitle>
    </CardHeader>
    <CardContent>
      {targeting.jobTitles && targeting.jobTitles.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm">Titres de poste</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {targeting.jobTitles.map((title, index) => (
              <Badge key={index} variant="outline">{title}</Badge>
            ))}
          </div>
        </div>
      )}
      {targeting.industries && targeting.industries.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm">Industries</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {targeting.industries.map((industry, index) => (
              <Badge key={index} variant="outline">{industry}</Badge>
            ))}
          </div>
        </div>
      )}
      {targeting.locations && targeting.locations.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm">Localisations</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {targeting.locations.map((location, index) => (
              <Badge key={index} variant="outline">{location}</Badge>
            ))}
          </div>
        </div>
      )}
      {targeting.companySize && targeting.companySize.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm">Taille d'entreprise</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {targeting.companySize.map((size, index) => (
              <Badge key={index} variant="outline">{size}</Badge>
            ))}
          </div>
        </div>
      )}
      {targeting.otherCriteria && (
        <div>
          <h4 className="font-semibold text-sm">Autres critères</h4>
          <p>{targeting.otherCriteria}</p>
        </div>
      )}
    </CardContent>
  </Card>
);
