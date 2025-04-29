
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WebLinkItem } from '@/components/common/WebLinkItem';
import { DownloadFileButton } from '@/components/common/DownloadFileButton';
import { DatabaseDetails as DatabaseDetailsType } from '@/types/types';

interface DatabaseDetailsProps {
  database: DatabaseDetailsType;
}

export const DatabaseDetails = ({ database }: DatabaseDetailsProps) => {
  return (
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
            <DownloadFileButton 
              fileUrl={database.fileUrl} 
              fileName="database.xlsx"
              label="Télécharger la base de données"
              className="mt-1"
            />
          </div>
        )}
        
        {/* Support pour l'affichage des webLinks (plusieurs liens) */}
        {database.webLinks && database.webLinks.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm mb-2">Liens web</h4>
            <div className="space-y-2">
              {database.webLinks.map((link, index) => (
                link && <WebLinkItem key={index} url={link} />
              ))}
            </div>
          </div>
        )}
        
        {/* Support pour l'affichage du webLink (pour la rétrocompatibilité) */}
        {!database.webLinks && database.webLink && (
          <div>
            <h4 className="font-semibold text-sm">Lien web</h4>
            <WebLinkItem url={database.webLink} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
