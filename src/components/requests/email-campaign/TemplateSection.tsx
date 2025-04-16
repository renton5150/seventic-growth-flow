
import { Control } from "react-hook-form";
import { Upload, Link } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileUploader } from "@/components/requests/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface TemplateSectionProps {
  control: Control<any>;
  handleFileUpload: (field: string, files: FileList | null) => void;
}

export const TemplateSection = ({ control, handleFileUpload }: TemplateSectionProps) => {
  const [showPreview, setShowPreview] = useState(false);
  
  return (
    <Card className="border-t-4 border-t-seventic-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Template de l'emailing</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium mb-2">Contenu</h4>
            <FormField
              control={control}
              name="templateContent"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      {showPreview ? (
                        <div className="relative">
                          <div 
                            className="min-h-[200px] border rounded-md p-4 overflow-auto bg-white"
                            dangerouslySetInnerHTML={{ __html: field.value || '' }}
                          />
                          <button 
                            type="button"
                            className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs"
                            onClick={() => setShowPreview(false)}
                          >
                            Éditer
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Textarea 
                            placeholder="Collez ici le contenu de votre template (HTML ou texte)" 
                            className="min-h-[200px] font-mono"
                            {...field}
                          />
                          <div className="absolute right-2 bottom-2 flex items-center gap-2">
                            <button
                              type="button"
                              className="text-xs bg-primary text-white px-2 py-1 rounded"
                              onClick={() => setShowPreview(true)}
                            >
                              Aperçu
                            </button>
                            <span className="text-xs text-muted-foreground">
                              HTML autorisé
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-2">Fichier</h4>
            <FormField
              control={control}
              name="templateFileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUploader
                      icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                      title="Importer votre template"
                      description="Formats acceptés : DOC, DOCX, HTML (Max 10 Mo)"
                      value={field.value}
                      onChange={(files) => handleFileUpload("templateFileUrl", files)}
                      accept=".doc,.docx,.html,.htm"
                      maxSize={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-2">Lien web</h4>
            <FormField
              control={control}
              name="templateWebLink"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Link className="h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="https://example.com/template" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
