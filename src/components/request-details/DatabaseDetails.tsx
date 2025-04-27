
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseRequest } from '@/types/types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile, extractFileName } from "@/services/database";
import { supabase } from '@/integrations/supabase/client';

interface DatabaseDetailsProps {
  request: DatabaseRequest;
}

export const DatabaseDetails = ({ request }: DatabaseDetailsProps) => {
  const { tool, targeting, blacklist, contactsCreated, resultFileUrl } = request;
  const [downloading, setDownloading] = useState<string | null>(null);
  const [fileCheckStatus, setFileCheckStatus] = useState<Record<string, boolean>>({});

  // Vérifier si un fichier existe réellement dans le stockage Supabase
  const checkFileExists = async (fileUrl: string): Promise<boolean> => {
    try {
      console.log(`Vérification de l'existence de: ${fileUrl}`);
      
      // Déterminer le chemin du fichier à partir de l'URL
      let path = fileUrl;
      
      // Si c'est une URL complète de Supabase Storage
      if (fileUrl.includes('/storage/v1/object/public/')) {
        const parts = fileUrl.split('/storage/v1/object/public/');
        if (parts.length > 1) {
          const bucketAndPath = parts[1].split('/', 1);
          path = parts[1].substring(bucketAndPath[0].length + 1);
          console.log(`Chemin extrait: ${path}`);
        }
      } 

      // Tenter une récupération directe pour vérifier l'existence
      const { data, error } = await supabase.storage
        .from('databases')
        .download(path);
      
      if (error) {
        console.log(`Fichier non trouvé via chemin direct: ${path}`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la vérification du fichier: ${fileUrl}`, error);
      return false;
    }
  };

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
      
      // Afficher un toast de chargement
      const loadingToast = toast.loading("Vérification et préparation du téléchargement...");
      
      // Vérifier si le fichier existe avant de tenter le téléchargement
      const exists = await checkFileExists(fileUrl);
      if (!exists) {
        toast.dismiss(loadingToast);
        toast.error("Le fichier demandé n'existe plus sur le serveur", {
          description: "Veuillez contacter l'administrateur"
        });
        setFileCheckStatus((prev) => ({ ...prev, [fileUrl]: false }));
        return;
      }
      
      setFileCheckStatus((prev) => ({ ...prev, [fileUrl]: true }));
      
      // Extraire le nom de fichier de l'URL ou utiliser le nom par défaut
      const fileName = extractFileName(fileUrl) || defaultFilename;
      console.log(`Téléchargement demandé pour: ${fileUrl}, nom: ${fileName}`);
      
      toast.dismiss(loadingToast);
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
    
    if (fileCheckStatus[fileUrl] === undefined) {
      // Vérifier automatiquement l'existence du fichier au chargement du composant
      checkFileExists(fileUrl).then(exists => {
        setFileCheckStatus((prev) => ({ ...prev, [fileUrl]: exists }));
      });
      return null;
    }
    
    return fileCheckStatus[fileUrl] ? (
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
                disabled={downloading === resultFileUrl || fileCheckStatus[resultFileUrl] === false}
              >
                <Download className="h-4 w-4" />
                {downloading === resultFileUrl ? 'Téléchargement...' : 'Télécharger le fichier résultat'}
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
                <>
                  {renderFileAvailability(blacklist.accounts.fileUrl)}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleFileDownload(blacklist.accounts.fileUrl, "blacklist-accounts.xlsx")}
                    className="flex items-center gap-2 mt-1"
                    disabled={downloading === blacklist.accounts.fileUrl || fileCheckStatus[blacklist.accounts.fileUrl] === false}
                  >
                    <Download className="h-4 w-4" />
                    {downloading === blacklist.accounts.fileUrl ? 'Téléchargement...' : 'Télécharger la liste de comptes exclus'}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
