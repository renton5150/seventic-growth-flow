
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseRequest } from '@/types/types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download } from 'lucide-react';

interface DatabaseDetailsProps {
  request: DatabaseRequest;
}

export const DatabaseDetails = ({ request }: DatabaseDetailsProps) => {
  const { tool, targeting, blacklist, contactsCreated, resultFileUrl } = request;

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
          <CardTitle>Informations de la requête</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Outil utilisé</h4>
            <p>{tool || "Non spécifié"}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Contacts créés</h4>
            <div className="flex items-center mt-1">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-lg font-medium">{contactsCreated || 0} contacts</span>
            </div>
          </div>
          
          {resultFileUrl && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm">Fichier résultat</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleFileDownload(resultFileUrl, "database-result.xlsx")}
                className="flex items-center gap-2 mt-1"
              >
                <Download className="h-4 w-4" />
                Télécharger le fichier résultat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Ciblage</CardTitle>
        </CardHeader>
        <CardContent>
          {targeting && (
            <>
              {targeting.jobTitles && targeting.jobTitles.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Titres de poste</h4>
                  <ul className="list-disc pl-5 mt-1">
                    {targeting.jobTitles.map((title, index) => (
                      <li key={index}>{title}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {targeting.industries && targeting.industries.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Industries</h4>
                  <ul className="list-disc pl-5 mt-1">
                    {targeting.industries.map((industry, index) => (
                      <li key={index}>{industry}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {targeting.locations && targeting.locations.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Localisations</h4>
                  <ul className="list-disc pl-5 mt-1">
                    {targeting.locations.map((location, index) => (
                      <li key={index}>{location}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {targeting.companySize && targeting.companySize.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Taille d'entreprise</h4>
                  <ul className="list-disc pl-5 mt-1">
                    {targeting.companySize.map((size, index) => (
                      <li key={index}>{size}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {targeting.otherCriteria && (
                <div className="mb-4">
                  <h4 className="font-semibold text-sm">Autres critères</h4>
                  <p className="mt-1">{targeting.otherCriteria}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {blacklist && blacklist.accounts && (
        <Card>
          <CardHeader>
            <CardTitle>Liste noire</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h4 className="font-semibold text-sm">Comptes exclus</h4>
              <p>{blacklist.accounts.notes || "Aucune note"}</p>
              {blacklist.accounts.fileUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleFileDownload(blacklist.accounts.fileUrl, "blacklist-accounts.xlsx")}
                  className="flex items-center gap-2 mt-1"
                >
                  <Download className="h-4 w-4" />
                  Télécharger la liste de comptes exclus
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
