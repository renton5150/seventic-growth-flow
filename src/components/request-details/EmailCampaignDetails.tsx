
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailCampaignRequest } from '@/types/types';

interface EmailCampaignDetailsProps {
  request: EmailCampaignRequest;
}

export const EmailCampaignDetails = ({ request }: EmailCampaignDetailsProps) => {
  const template = request.template || { content: "", webLink: "", fileUrl: "" };
  const database = request.database || { notes: "", webLink: "", fileUrl: "" };
  const blacklist = request.blacklist || {
    accounts: { notes: "", fileUrl: "" },
    emails: { notes: "", fileUrl: "" }
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Template Email</CardTitle>
        </CardHeader>
        <CardContent>
          {template.content && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm">Contenu</h4>
              <div className="p-4 border rounded-md bg-gray-50 mt-1" dangerouslySetInnerHTML={{ __html: template.content }} />
            </div>
          )}
          {template.webLink && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm">Lien web</h4>
              <a href={template.webLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                {template.webLink}
              </a>
            </div>
          )}
          {template.fileUrl && (
            <div>
              <h4 className="font-semibold text-sm">Fichier attaché</h4>
              <a href={template.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                Télécharger le fichier
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Base de données</CardTitle>
        </CardHeader>
        <CardContent>
          {database.notes && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm">Notes</h4>
              <p>{database.notes}</p>
            </div>
          )}
          {database.fileUrl && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm">Fichier</h4>
              <a href={database.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                Télécharger la base de données
              </a>
            </div>
          )}
          {database.webLink && (
            <div>
              <h4 className="font-semibold text-sm">Lien web</h4>
              <a href={database.webLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                {database.webLink}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {blacklist && (blacklist.accounts || blacklist.emails) && (
        <Card>
          <CardHeader>
            <CardTitle>Liste noire</CardTitle>
          </CardHeader>
          <CardContent>
            {blacklist.accounts && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Comptes exclus</h4>
                <p>{blacklist.accounts.notes}</p>
                {blacklist.accounts.fileUrl && (
                  <a href={blacklist.accounts.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    Télécharger la liste de comptes
                  </a>
                )}
              </div>
            )}
            {blacklist.emails && (
              <div>
                <h4 className="font-semibold text-sm">Emails exclus</h4>
                <p>{blacklist.emails.notes}</p>
                {blacklist.emails.fileUrl && (
                  <a href={blacklist.emails.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    Télécharger la liste d'emails
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};
