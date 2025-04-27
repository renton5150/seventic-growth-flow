
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
  const { tool, targeting, blacklist, contactsCreated, resultFileUrl } = request;
  const [downloading, setDownloading] = useState<string | null>(null);
  const [fileStatuses, setFileStatuses] = useState<Record<string, boolean | null>>({});
  const [isCheckingFiles, setIsCheckingFiles] = useState(true);

  // Vérifier tous les fichiers au chargement du composant
  useEffect(() => {
    const checkAllFiles = async () => {
      setIsCheckingFiles(true);
      
      try {
        // Collecter tous les URLs de fichiers à vérifier
        const filesToCheck: string[] = [];
        
        if (resultFileUrl) filesToCheck.push(resultFileUrl);
        
        if (blacklist?.accounts?.fileUrl) filesToCheck.push(blacklist.accounts.fileUrl);
        if (blacklist?.contacts?.fileUrl) filesToCheck.push(blacklist.contacts.fileUrl);
        if (blacklist?.emails?.fileUrl) filesToCheck.push(blacklist.emails.fileUrl);
        
        if (filesToCheck.length === 0) {
          setIsCheckingFiles(false);
          return;
        }
        
        // Vérifier chaque fichier
        const statusesPromises = filesToCheck.map(async (url) => {
          if (!url) return [url, false];
          const exists = await checkFileExists(url);
          console.log(`Vérification de ${url}: ${exists ? "Existe" : "N'existe pas"}`);
          return [url, exists];
        });
        
        const statusesArray = await Promise.all(statusesPromises);
        
        // Construire l'objet des statuts
        const newStatuses = statusesArray.reduce((acc, [url, exists]) => {
          if (url) acc[url as string] = exists;
          return acc;
        }, {} as Record<string, boolean>);
        
        setFileStatuses(newStatuses);
      } catch (error) {
        console.error("Erreur lors de la vérification des fichiers:", error);
      } finally {
        setIsCheckingFiles(false);
      }
    };
    
    checkAllFiles();
  }, [resultFileUrl, blacklist]);

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
      
      // Vérifier si le fichier existe avant de tenter le téléchargement
      const exists = await checkFileExists(fileUrl);
      if (!exists) {
        toast.error("Le fichier demandé n'existe plus sur le serveur", {
          description: "Veuillez contacter l'administrateur"
        });
        setFileStatuses(prev => ({ ...prev, [fileUrl]: false }));
        return;
      }
      
      setFileStatuses(prev => ({ ...prev, [fileUrl]: true }));
      
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

  const renderFileAvailability = (fileUrl: string | undefined) => {
    if (!fileUrl) return null;
    
    // Si on est en train de vérifier tous les fichiers
    if (isCheckingFiles) {
      return (
        <span className="text-xs text-blue-600 flex items-center gap-1 mb-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Vérification du fichier...
        </span>
      );
    }
    
    // Si le statut est connu
    if (fileStatuses[fileUrl] !== undefined) {
      return fileStatuses[fileUrl] ? (
        <span className="text-xs text-green-600 flex items-center gap-1 mb-1">
          <CheckCircle2 className="h-3 w-3" />
          Fichier disponible
        </span>
      ) : (
        <span className="text-xs text-amber-600 flex items-center gap-1 mb-1">
          <AlertTriangle className="h-3 w-3" />
          Fichier non disponible
        </span>
      );
    }
    
    return null;
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
              {renderFileAvailability(resultFileUrl)}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleFileDownload(resultFileUrl, "database-result.xlsx")}
                className="flex items-center gap-2 mt-1"
                disabled={downloading === resultFileUrl || fileStatuses[resultFileUrl] === false}
              >
                {downloading === resultFileUrl ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Télécharger le fichier résultat
                  </>
                )}
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
                {blacklist.accounts.fileUrl && (
                  <>
                    {renderFileAvailability(blacklist.accounts.fileUrl)}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleFileDownload(blacklist.accounts.fileUrl, "blacklist-accounts.xlsx")}
                      className="flex items-center gap-2 mt-1"
                      disabled={downloading === blacklist.accounts.fileUrl || fileStatuses[blacklist.accounts.fileUrl] === false}
                    >
                      {downloading === blacklist.accounts.fileUrl ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Télécharger la liste de comptes exclus
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
            
            {blacklist.contacts && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm">Contacts exclus</h4>
                <p>{blacklist.contacts.notes || "Aucune note"}</p>
                {blacklist.contacts.fileUrl && (
                  <>
                    {renderFileAvailability(blacklist.contacts.fileUrl)}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleFileDownload(blacklist.contacts.fileUrl, "blacklist-contacts.xlsx")}
                      className="flex items-center gap-2 mt-1"
                      disabled={downloading === blacklist.contacts.fileUrl || fileStatuses[blacklist.contacts.fileUrl] === false}
                    >
                      {downloading === blacklist.contacts.fileUrl ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Télécharger la liste de contacts exclus
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
            
            {blacklist.emails && (
              <div>
                <h4 className="font-semibold text-sm">Emails exclus</h4>
                <p>{blacklist.emails.notes || "Aucune note"}</p>
                {blacklist.emails.fileUrl && (
                  <>
                    {renderFileAvailability(blacklist.emails.fileUrl)}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleFileDownload(blacklist.emails.fileUrl, "blacklist-emails.xlsx")}
                      className="flex items-center gap-2 mt-1"
                      disabled={downloading === blacklist.emails.fileUrl || fileStatuses[blacklist.emails.fileUrl] === false}
                    >
                      {downloading === blacklist.emails.fileUrl ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Télécharger la liste d'emails exclus
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};
