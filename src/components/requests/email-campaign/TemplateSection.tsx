
import { Control } from "react-hook-form";
import { Upload, Link } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FileUploader } from "@/components/requests/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import { Spinner } from "@/components/ui/spinner";

interface TemplateSectionProps {
  control: Control<any>;
  handleFileUpload: (field: string, files: FileList | null | string) => void;
}

export const TemplateSection = ({ control, handleFileUpload }: TemplateSectionProps) => {
  const [editorLoading, setEditorLoading] = useState(true);
  
  // Modules pour configurer Quill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      // Toggle to add extra line breaks when pasting HTML:
      matchVisual: false,
    }
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet',
    'link', 'image'
  ];
  
  useEffect(() => {
    // Simuler un temps de chargement court pour l'interface utilisateur
    const timer = setTimeout(() => {
      setEditorLoading(false);
    }, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <Card className="border-t-4 border-t-seventic-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Template de l'emailing</h3>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
          <p className="text-yellow-700">Les fonctionnalités d'emailing ont été désactivées.</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium mb-2">Contenu</h4>
            <FormField
              control={control}
              name="templateContent"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative border rounded-md overflow-hidden min-h-[400px]">
                      {!editorLoading ? (
                        <ReactQuill
                          theme="snow"
                          value={field.value}
                          onChange={field.onChange}
                          modules={modules}
                          formats={formats}
                          className="min-h-[370px]"
                          placeholder="Rédigez votre email ici..."
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Spinner className="h-5 w-5" />
                            <span>Chargement de l'éditeur...</span>
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
