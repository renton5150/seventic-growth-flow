
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseRequest } from '@/types/types';
import { CheckCircle2 } from 'lucide-react';
import { DownloadFileButton } from '@/components/common/DownloadFileButton';

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
    accounts: { notes: "", fileUrl: "", fileUrls: [] },
    emails: { notes: "", fileUrl: "", fileUrls: [] }
  };
  const contactsCreated = request.contactsCreated || request.details?.contactsCreated || 0;
  const resultFileUrl = request.resultFileUrl || request.details?.resultFileUrl;

  console.log("Propriétés extraites:", { tool, targeting, blacklist, contactsCreated, resultFileUrl });

  // Fonction pour extraire un nom de fichier significatif à partir de l'URL
  const getFileName = (url: string): string => {
    if (!url) return "fichier.csv";
    
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
      return "fichier.csv";
    }
  };

  // Fonction pour récupérer tous les fichiers (nouveau format et ancien pour rétrocompatibilité)
  const getAllFiles = (item: any): string[] => {
    const files: string[] = [];
    
    // Nouveau format avec fileUrls
    if (item?.fileUrls && Array.isArray(item.fileUrls) && item.fileUrls.length > 0) {
      files.push(...item.fileUrls);
    }
    
    // Ancien format avec fileUrl (pour rétrocompatibilité)
    if (item?.fileUrl && !files.includes(item.fileUrl)) {
      files.push(item.fileUrl);
    }
    
    return files.filter(Boolean);
  };

  // Récupérer les fichiers de blacklist
  const accountFiles = getAllFiles(blacklist.accounts);
  const emailFiles = getAllFiles(blacklist.emails);

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
              <DownloadFileButton
                fileUrl={resultFileUrl}
                fileName="database-result.xlsx"
                label="Télécharger le fichier résultat"
                className="mt-1"
              />
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
                <p className="mb-2">{blacklist.accounts.notes || "Aucune note"}</p>
                {accountFiles.length > 0 && (
                  <div className="space-y-2">
                    {accountFiles.map((fileUrl, index) => (
                      <DownloadFileButton
                        key={index}
                        fileUrl={fileUrl}
                        fileName={getFileName(fileUrl)}
                        label={`Télécharger ${getFileName(fileUrl)}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {blacklist.emails && (
              <div>
                <h4 className="font-semibold text-sm">Emails exclus</h4>
                <p className="mb-2">{blacklist.emails.notes || "Aucune note"}</p>
                {emailFiles.length > 0 && (
                  <div className="space-y-2">
                    {emailFiles.map((fileUrl, index) => (
                      <DownloadFileButton
                        key={index}
                        fileUrl={fileUrl}
                        fileName={getFileName(fileUrl)}
                        label={`Télécharger ${getFileName(fileUrl)}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};
