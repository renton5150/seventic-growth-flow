
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WebLinkItem } from '@/components/common/WebLinkItem';
import { DownloadFileButton } from '@/components/common/DownloadFileButton';
import { DatabaseDetails as DatabaseDetailsType } from '@/types/types';

interface DatabaseDetailsProps {
  database: DatabaseDetailsType;
}

export const DatabaseDetails = ({ database }: DatabaseDetailsProps) => {
  // Fonction pour extraire un nom de fichier significatif à partir de l'URL
  const getFileName = (url: string): string => {
    if (!url) return "database.xlsx";
    
    try {
      const segments = url.split('/');
      const fileName = segments[segments.length - 1];
      const decodedFileName = decodeURIComponent(fileName);
      
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

  // Récupérer tous les fichiers (nouveau format et ancien pour rétrocompatibilité)
  const getAllFiles = (): string[] => {
    const files: string[] = [];
    
    // Nouveau format avec fileUrls
    if (database.fileUrls && database.fileUrls.length > 0) {
      files.push(...database.fileUrls);
    }
    
    // Ancien format avec fileUrl (pour rétrocompatibilité)
    if (database.fileUrl && !files.includes(database.fileUrl)) {
      files.push(database.fileUrl);
    }
    
    return files.filter(Boolean);
  };

  const allFiles = getAllFiles();

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
        
        {allFiles.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm">
              {allFiles.length === 1 ? "Fichier" : "Fichiers"}
            </h4>
            <div className="space-y-2 mt-1">
              {allFiles.map((fileUrl, index) => (
                <DownloadFileButton 
                  key={index}
                  fileUrl={fileUrl} 
                  fileName={getFileName(fileUrl)}
                  label={`Télécharger ${getFileName(fileUrl)}`}
                  className="block"
                />
              ))}
            </div>
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
