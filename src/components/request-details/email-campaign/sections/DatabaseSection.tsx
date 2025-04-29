
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WebLinkItem } from '@/components/common/WebLinkItem';
import { DownloadFileButton } from '@/components/common/DownloadFileButton';
import { DatabaseDetails } from '@/types/types';

interface DatabaseSectionProps {
  database: DatabaseDetails;
}

export const DatabaseSection = ({ database }: DatabaseSectionProps) => {
  console.log("Rendu du composant DatabaseSection avec:", database);
  
  // Fonction pour extraire un nom de fichier significatif à partir de l'URL
  const getFileName = (url: string): string => {
    try {
      // Essayer d'extraire le nom du fichier de l'URL
      const segments = url.split('/');
      const fileName = segments[segments.length - 1];
      
      // Décoder le nom s'il contient des caractères encodés
      const decodedFileName = decodeURIComponent(fileName);
      
      // Si le nom commence par un timestamp, essayer d'extraire le vrai nom
      if (/^\d+_/.test(decodedFileName)) {
        const namePart = decodedFileName.split('_').slice(1).join('_');
        if (namePart) {
          return namePart;
        }
      }
      
      return decodedFileName;
    } catch (e) {
      console.error("Erreur lors de l'extraction du nom de fichier:", e);
      return "database.xlsx";
    }
  };
  
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
              fileName={getFileName(database.fileUrl)}
              label="Télécharger la base de données"
              className="mt-1"
            />
          </div>
        )}
        
        {/* Support pour l'affichage des webLinks (plusieurs liens) */}
        {database.webLinks && database.webLinks.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm">Liens web</h4>
            <div className="space-y-2 mt-2">
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
