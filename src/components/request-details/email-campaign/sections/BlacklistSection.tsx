
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/services/database';
import { toast } from 'sonner';
import { Blacklist } from '@/types/types';

interface BlacklistSectionProps {
  blacklist: Blacklist;
}

export const BlacklistSection = ({ blacklist }: BlacklistSectionProps) => {
  const handleFileDownload = async (url: string | undefined, filename: string = "document") => {
    if (!url) {
      toast.error("Aucune URL de fichier disponible");
      return;
    }
    
    try {
      console.log(`Téléchargement demandé pour: ${url}`);
      
      // Afficher un toast de chargement
      toast.loading("Téléchargement en cours...");
      
      const success = await downloadFile(url, filename);
      
      // Supprimer le toast de chargement
      toast.dismiss();
      
      if (success) {
        toast.success(`Téléchargement de "${filename}" réussi`);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error("Erreur lors du téléchargement du fichier");
    }
  };

  if (!blacklist || (!blacklist.accounts && !blacklist.emails)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste noire</CardTitle>
      </CardHeader>
      <CardContent>
        {blacklist.accounts && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Comptes exclus</h4>
            {blacklist.accounts.notes && <p>{blacklist.accounts.notes}</p>}
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
            {blacklist.emails.notes && <p>{blacklist.emails.notes}</p>}
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
  );
};
