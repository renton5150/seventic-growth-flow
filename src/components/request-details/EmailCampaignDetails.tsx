
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailCampaignRequest } from '@/types/types';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/services/database';
import { toast } from 'sonner';

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
  const handleFileDownload = async (url: string | undefined, filename: string = "document") => {
    if (!url) {
      toast.error("Aucune URL de fichier disponible");
      return;
    }
    
    try {
      console.log(`Téléchargement demandé pour: ${url}`);
      const success = await downloadFile(url, filename);
      
      if (!success) {
        toast.error("Erreur lors du téléchargement du fichier");
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
