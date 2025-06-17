
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WebLinkItem } from '@/components/common/WebLinkItem';
import { DownloadFileButton } from '@/components/common/DownloadFileButton';
import { Database } from '@/types/types';

interface DatabaseSectionProps {
  database: Database;
}

export const DatabaseSection = ({ database }: DatabaseSectionProps) => {
  console.log("Rendu du composant DatabaseSection avec:", JSON.stringify(database, null, 2));
  
  // Ensure we have a valid database object with all required properties
  const safeDatabase: Database = {
    notes: database?.notes || "",
    webLink: database?.webLink || "",
    fileUrl: database?.fileUrl || "",
    webLinks: database?.webLinks || [],
    fileUrls: database?.fileUrls || []
  };
  
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
    if (safeDatabase.fileUrls && safeDatabase.fileUrls.length > 0) {
      files.push(...safeDatabase.fileUrls);
    }
    
    // Ancien format avec fileUrl (pour rétrocompatibilité)
    if (safeDatabase.fileUrl && !files.includes(safeDatabase.fileUrl)) {
      files.push(safeDatabase.fileUrl);
    }
    
    return files.filter(Boolean);
  };

  const allFiles = getAllFiles();

  // Show nothing if there's no content to display
  if (!safeDatabase.notes && allFiles.length === 0 && !safeDatabase.webLink && safeDatabase.webLinks.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Base de données</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 italic">Aucune information de base de données disponible</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Base de données</CardTitle>
      </CardHeader>
      <CardContent>
        {safeDatabase.notes && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Notes</h4>
            <p>{safeDatabase.notes}</p>
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
        {safeDatabase.webLinks.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm">Liens web</h4>
            <div className="space-y-2 mt-2">
              {safeDatabase.webLinks.map((link, index) => (
                link && <WebLinkItem key={index} url={link} />
              ))}
            </div>
          </div>
        )}
        
        {/* Support pour l'affichage du webLink (pour la rétrocompatibilité) */}
        {!safeDatabase.webLinks.length && safeDatabase.webLink && (
          <div>
            <h4 className="font-semibold text-sm">Lien web</h4>
            <WebLinkItem url={safeDatabase.webLink} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
