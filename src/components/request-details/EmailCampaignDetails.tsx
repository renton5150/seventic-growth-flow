
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailCampaignRequest } from '@/types/types';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Fonction pour télécharger un fichier à partir d'une URL
  const handleFileDownload = (url: string | undefined, filename: string = "document") => {
    if (!url) return;
    
    // Cas 1: URL complète (http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank');
      return;
    }
    
    // Cas 2: Chemin local (pour les chemins simulés en mode démo)
    const element = document.createElement('a');
    
    // Déterminer le type de fichier à partir de l'extension
    const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
    let mimeType = 'application/octet-stream';
    
    // Configurer le type MIME correct selon l'extension
    if (fileExtension === 'xlsx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (fileExtension === 'xls') {
      mimeType = 'application/vnd.ms-excel';
    } else if (fileExtension === 'csv') {
      mimeType = 'text/csv';
    } else if (fileExtension === 'pdf') {
      mimeType = 'application/pdf';
    } else if (fileExtension === 'docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (fileExtension === 'doc') {
      mimeType = 'application/msword';
    }
    
    // Créer un contenu approprié selon le type de fichier
    let fileContent;
    
    if (fileExtension === 'csv') {
      // En-tête CSV minimal valide
      fileContent = 'Column1,Column2,Column3\nValue1,Value2,Value3';
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Pour les fichiers Excel, utiliser un en-tête minimal
      fileContent = new Uint8Array([
        0x50, 0x4B, 0x03, 0x04, // Signature pour les fichiers XLSX (ZIP)
        0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
    } else {
      // Pour les autres types de fichiers
      fileContent = 'Contenu simulé pour le mode démo';
    }
    
    const blob = new Blob([fileContent], { type: mimeType });
    element.href = URL.createObjectURL(blob);
    
    // Extraire le nom du fichier depuis l'URL
    const extractedFilename = url.split('/').pop() || filename;
    element.download = decodeURIComponent(extractedFilename);
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Libérer l'URL créée
    setTimeout(() => {
      URL.revokeObjectURL(element.href);
    }, 100);
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
              <div 
                className="border rounded-md p-4 bg-white mt-1 overflow-auto max-h-[500px]"
                dangerouslySetInnerHTML={{ __html: template.content }}
              />
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleFileDownload(template.fileUrl, "template")}
                className="flex items-center gap-2 mt-1"
              >
                <Download className="h-4 w-4" />
                Télécharger le fichier
              </Button>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleFileDownload(blacklist.accounts.fileUrl, "blacklist-accounts.xlsx")}
                    className="flex items-center gap-2 mt-1"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger la liste de comptes
                  </Button>
                )}
              </div>
            )}
            {blacklist.emails && (
              <div>
                <h4 className="font-semibold text-sm">Emails exclus</h4>
                <p>{blacklist.emails.notes}</p>
                {blacklist.emails.fileUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleFileDownload(blacklist.emails.fileUrl, "blacklist-emails.xlsx")}
                    className="flex items-center gap-2 mt-1"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger la liste d'emails
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};
