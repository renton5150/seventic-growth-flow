
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseRequest } from '@/types/types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile } from "@/services/database";

interface DatabaseDetailsProps {
  request: DatabaseRequest;
}

export const DatabaseDetails = ({ request }: DatabaseDetailsProps) => {
  const { tool, targeting, blacklist, contactsCreated, resultFileUrl } = request;

  // Fonction pour télécharger un fichier à partir d'une URL
  const handleFileDownload = async (fileUrl: string | undefined, filename: string = "document") => {
    if (!fileUrl) {
      toast.error("URL du fichier invalide");
      return;
    }
    
    try {
      console.log(`Téléchargement demandé pour: ${fileUrl}, nom: ${filename}`);
      const success = await downloadFile(fileUrl, filename);
      
      if (success) {
        toast.success(`Téléchargement de "${filename}" réussi`);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error("Erreur lors du téléchargement du fichier");
    }
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
