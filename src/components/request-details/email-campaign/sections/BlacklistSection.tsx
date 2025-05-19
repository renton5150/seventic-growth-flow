
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadFileButton } from '@/components/common/DownloadFileButton';
import { Blacklist } from '@/types/types';

interface BlacklistSectionProps {
  blacklist: Blacklist;
}

export const BlacklistSection = ({ blacklist }: BlacklistSectionProps) => {
  console.log("Rendu du composant BlacklistSection avec:", blacklist);
  
  // Si aucune liste noire n'est définie ou si elle est vide, ne rien afficher
  if (!blacklist || (!blacklist.accounts && !blacklist.emails)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste noire</CardTitle>
      </CardHeader>
      <CardContent>
        {blacklist.accounts && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Comptes exclus</h4>
            {blacklist.accounts.notes && <p className="mt-1">{blacklist.accounts.notes}</p>}
            {blacklist.accounts.fileUrl && (
              <DownloadFileButton 
                fileUrl={blacklist.accounts.fileUrl} 
                fileName="blacklist-accounts.xlsx"
                label="Télécharger la liste de comptes"
                className="mt-2"
              />
            )}
          </div>
        )}
        
        {blacklist.emails && (
          <div>
            <h4 className="font-semibold text-sm">Emails exclus</h4>
            {blacklist.emails.notes && <p className="mt-1">{blacklist.emails.notes}</p>}
            {blacklist.emails.fileUrl && (
              <DownloadFileButton 
                fileUrl={blacklist.emails.fileUrl} 
                fileName="blacklist-emails.xlsx"
                label="Télécharger la liste d'emails"
                className="mt-2"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
