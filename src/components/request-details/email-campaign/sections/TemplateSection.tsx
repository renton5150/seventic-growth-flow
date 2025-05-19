
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/services/database';
import { toast } from 'sonner';
import { EmailTemplate } from '@/types/types';

interface TemplateDetailsProps {
  template: EmailTemplate;
}

export const TemplateSection = ({ template }: TemplateDetailsProps) => {
  console.log("Rendu du composant TemplateSection avec:", JSON.stringify(template, null, 2));
  
  const [downloading, setDownloading] = useState(false);
  
  // Ensure template object is valid
  const safeTemplate = template || { content: "", webLink: "", fileUrl: "" };

  const handleFileDownload = async (url: string | undefined, filename: string = "document") => {
    if (!url) {
      toast.error("Aucune URL de fichier disponible");
      return;
    }
    
    if (downloading) {
      return; // Éviter les téléchargements multiples
    }
    
    try {
      console.log(`Téléchargement demandé pour: ${url}`);
      
      setDownloading(true);
      
      // Afficher un toast de chargement
      const loadingToast = toast.loading("Téléchargement en cours...");
      
      const success = await downloadFile(url, filename);
      
      // Supprimer le toast de chargement
      toast.dismiss(loadingToast);
      
      if (success) {
        toast.success(`Téléchargement de "${filename}" réussi`);
      } else {
        // Afficher un message d'erreur spécifique si le téléchargement échoue
        toast.error("Le fichier n'a pas pu être téléchargé");
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error("Erreur lors du téléchargement du fichier");
    } finally {
      setDownloading(false);
    }
  };

  // Show simplified view if no content available
  if (!safeTemplate.content && !safeTemplate.webLink && !safeTemplate.fileUrl) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Template Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 italic">Aucun contenu de template disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Template Email</CardTitle>
      </CardHeader>
      <CardContent>
        {safeTemplate.content && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Contenu</h4>
            <div 
              className="border rounded-md p-4 bg-white mt-1 overflow-auto max-h-[500px]"
              dangerouslySetInnerHTML={{ __html: safeTemplate.content }}
            />
          </div>
        )}
        {safeTemplate.webLink && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Lien web</h4>
            <a href={safeTemplate.webLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
              {safeTemplate.webLink}
            </a>
          </div>
        )}
        {safeTemplate.fileUrl && (
          <div>
            <h4 className="font-semibold text-sm">Fichier attaché</h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleFileDownload(safeTemplate.fileUrl, "template.docx")}
              className="flex items-center gap-2 mt-1"
              disabled={downloading}
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Téléchargement...' : 'Télécharger le fichier'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
