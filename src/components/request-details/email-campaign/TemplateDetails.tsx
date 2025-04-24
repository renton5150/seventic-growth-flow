
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/services/database';
import { toast } from 'sonner';
import { EmailTemplate } from '@/types/types';

interface TemplateDetailsProps {
  template: EmailTemplate;
}

export const TemplateDetails = ({ template }: TemplateDetailsProps) => {
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
  );
};
