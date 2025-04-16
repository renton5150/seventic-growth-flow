
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatabaseRequest } from '@/types/types';

interface DatabaseDetailsProps {
  request: DatabaseRequest;
}

export const DatabaseDetails = ({ request }: DatabaseDetailsProps) => {
  const tool = request.tool || "";
  const targeting = request.targeting || {
    jobTitles: [],
    industries: [],
    locations: [],
    companySize: [],
    otherCriteria: ""
  };
  const blacklist = request.blacklist || { accounts: { notes: "", fileUrl: "" } };
  const contactsCreated = request.contactsCreated || 0;

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
        </CardHeader>
        <CardContent>
          {tool && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm">Outil utilisé</h4>
              <p>{tool}</p>
            </div>
          )}
          {contactsCreated > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm">Contacts créés</h4>
              <p>{contactsCreated}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <TargetingSection targeting={targeting} />

      {blacklist && blacklist.accounts && (
        <Card>
          <CardHeader>
            <CardTitle>Liste noire</CardTitle>
          </CardHeader>
          <CardContent>
            {blacklist.accounts.notes && (
              <p>{blacklist.accounts.notes}</p>
            )}
            {blacklist.accounts.fileUrl && (
              <a href={blacklist.accounts.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                Télécharger la liste d'exclusions
              </a>
            )}
          </CardContent>
        </Card>
      )}
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
  <Card className="mb-4">
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
