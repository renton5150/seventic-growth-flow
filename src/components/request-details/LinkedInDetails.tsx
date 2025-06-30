
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkedInScrapingRequest } from '@/types/types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download } from 'lucide-react';

interface LinkedInDetailsProps {
  request: LinkedInScrapingRequest;
}

export const LinkedInDetails = ({ request }: LinkedInDetailsProps) => {
  // CORRECTION: Accéder aux données de ciblage via details.targeting
  const targeting = request.details?.targeting;
  const { profilesScraped, resultFileUrl } = request;

  console.log("🔍 [LinkedInDetails] Request data:", request);
  console.log("🎯 [LinkedInDetails] Targeting data:", targeting);

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
    const blob = new Blob(['Contenu simulé pour le mode démo'], { type: 'application/octet-stream' });
    element.href = URL.createObjectURL(blob);
    const extractedFilename = url.split('/').pop() || filename;
    element.download = decodeURIComponent(extractedFilename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Informations de la requête</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Profils récupérés</h4>
            <div className="flex items-center mt-1">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-lg font-medium">{profilesScraped || 0} profils</span>
            </div>
          </div>
          
          {resultFileUrl && (
            <div>
              <h4 className="font-semibold text-sm">Fichier résultat</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleFileDownload(resultFileUrl, "linkedin-result")}
                className="flex items-center gap-2 mt-1"
              >
                <Download className="h-4 w-4" />
                Télécharger les résultats
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ciblage</CardTitle>
        </CardHeader>
        <CardContent>
          {targeting ? (
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
                <div>
                  <h4 className="font-semibold text-sm">Autres critères</h4>
                  <p className="mt-1">{targeting.otherCriteria}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 italic">Aucune donnée de ciblage disponible</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};
