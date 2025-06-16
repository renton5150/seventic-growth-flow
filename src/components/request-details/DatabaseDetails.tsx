
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseRequest } from '@/types/types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile, extractFileName, checkFileExists } from "@/services/database";

interface DatabaseDetailsProps {
  request: DatabaseRequest;
}

export const DatabaseDetails = ({ request }: DatabaseDetailsProps) => {
  console.log("Rendu DatabaseDetails avec:", request);
  
  // Extraire les propriétés directement du request ou des details en fallback
  const tool = request.tool || request.details?.tool || "Non spécifié";
  const targeting = request.targeting || request.details?.targeting || {
    jobTitles: [],
    industries: [],
    locations: [],
    companySize: [],
    otherCriteria: ""
  };
  const blacklist = request.blacklist || request.details?.blacklist || {
    accounts: { notes: "", fileUrl: "" },
    emails: { notes: "", fileUrl: "" }
  };
  const contactsCreated = request.contactsCreated || request.details?.contactsCreated || 0;
  const resultFileUrl = request.resultFileUrl || request.details?.resultFileUrl;

  console.log("Propriétés extraites:", { tool, targeting, blacklist, contactsCreated, resultFileUrl });

  const [downloading, setDownloading] = useState<string | null>(null);
  const [fileStatuses, setFileStatuses] = useState<Record<string, boolean | null>>({});
  const [isCheckingFiles, setIsCheckingFiles] = useState(false);

  // Fonction pour télécharger un fichier à partir d'une URL
  const handleFileDownload = async (fileUrl: string | undefined, defaultFilename: string = "document") => {
    if (!fileUrl) {
      toast.error("URL du fichier invalide");
      return;
    }
    
    if (downloading === fileUrl) {
      return; // Éviter les téléchargements multiples
    }
    
    try {
      setDownloading(fileUrl);
      
      // Extraire le nom de fichier de l'URL ou utiliser le nom par défaut
      const fileName = extractFileName(fileUrl) || defaultFilename;
      console.log(`Téléchargement demandé pour: ${fileUrl}, nom: ${fileName}`);
      
      const downloadToast = toast.loading("Téléchargement en cours...");
      
      const success = await downloadFile(fileUrl, fileName);
      
      // Supprimer le toast de chargement
      toast.dismiss(downloadToast);
      
      if (!success) {
        toast.error("Erreur lors du téléchargement du fichier");
      } else {
        toast.success(`Fichier "${fileName}" téléchargé avec succès`);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error("Erreur lors du téléchargement du fichier");
    } finally {
      setDownloading(null);
    }
  };

  const renderFileDownloadButton = (fileUrl: string | undefined, fileName: string, label: string) => {
    if (!fileUrl) return null;
    
    return (
      <>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleFileDownload(fileUrl, fileName)}
          className="flex items-center gap-2 mt-1"
          disabled={downloading === fileUrl}
        >
          {downloading === fileUrl ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {label}
            </>
          )}
        </Button>
      </>
    );
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
            <p>{tool}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Contacts créés</h4>
            <div className="flex items-center mt-1">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-lg font-medium">{contactsCreated} contacts</span>
            </div>
          </div>
          
          {resultFileUrl && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm">Fichier résultat</h4>
              {renderFileDownloadButton(resultFileUrl, "database-result.xlsx", "Télécharger le fichier résultat")}
            </div>
          )}
        </CardContent>
      </Card>

      {targeting && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Ciblage</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {blacklist && (
        <Card>
          <CardHeader>
            <CardTitle>Liste noire</CardTitle>
          </CardHeader>
          <CardContent>
            {blacklist.accounts && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Comptes exclus</h4>
                <p>{blacklist.accounts.notes || "Aucune note"}</p>
                {blacklist.accounts.fileUrl && renderFileDownloadButton(
                  blacklist.accounts.fileUrl, 
                  "blacklist-accounts.xlsx", 
                  "Télécharger la liste de comptes exclus"
                )}
              </div>
            )}
            
            {blacklist.contacts && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Contacts exclus</h4>
                <p>{blacklist.contacts.notes || "Aucune note"}</p>
                {blacklist.contacts.fileUrl && renderFileDownloadButton(
                  blacklist.contacts.fileUrl, 
                  "blacklist-contacts.xlsx", 
                  "Télécharger la liste de contacts exclus"
                )}
              </div>
            )}
            
            {blacklist.emails && (
              <div>
                <h4 className="font-semibold text-sm">Emails exclus</h4>
                <p>{blacklist.emails.notes || "Aucune note"}</p>
                {blacklist.emails.fileUrl && renderFileDownloadButton(
                  blacklist.emails.fileUrl, 
                  "blacklist-emails.xlsx", 
                  "Télécharger la liste d'emails exclus"
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};
