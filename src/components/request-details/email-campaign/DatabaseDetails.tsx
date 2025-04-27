
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/services/database';
import { toast } from 'sonner';
import { DatabaseDetails as DatabaseDetailsType } from '@/types/types';

interface DatabaseDetailsProps {
  database: DatabaseDetailsType;
}

export const DatabaseDetails = ({ database }: DatabaseDetailsProps) => {
  const handleFileDownload = async (url: string | undefined, filename: string = "document") => {
    if (!url) {
      toast.error("Aucune URL de fichier disponible");
      return;
    }
    
    try {
      console.log(`Téléchargement demandé pour: ${url}`);
      const success = await downloadFile(url, filename);
      
      if (success) {
        toast.success(`Téléchargement de "${filename}" réussi`);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error("Erreur lors du téléchargement du fichier");
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleFileDownload(database.fileUrl, "database.xlsx")}
              className="flex items-center gap-2 mt-1"
            >
              <Download className="h-4 w-4" />
              Télécharger la base de données
            </Button>
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
  );
};
