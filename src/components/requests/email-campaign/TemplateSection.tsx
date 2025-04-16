
import { Control } from "react-hook-form";
import { Upload, Link } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FileUploader } from "@/components/requests/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useRef } from "react";
import { Editor } from '@tinymce/tinymce-react';

interface TemplateSectionProps {
  control: Control<any>;
  handleFileUpload: (field: string, files: FileList | null) => void;
}

export const TemplateSection = ({ control, handleFileUpload }: TemplateSectionProps) => {
  const editorRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  
  const handleEditorInit = (evt: any, editor: any) => {
    editorRef.current = editor;
    setIsEditorReady(true);
  };

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
                    <div className="relative border rounded-md overflow-hidden">
                      <Editor
                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                        onInit={handleEditorInit}
                        initialValue={field.value}
                        value={field.value}
                        onEditorChange={(content) => {
                          field.onChange(content);
                        }}
                        init={{
                          height: 400,
                          menubar: true,
                          plugins: [
                            'advlist', 'autolink', 'link', 'image', 'lists', 'charmap', 'preview', 'anchor', 
                            'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 
                            'media', 'table', 'help', 'wordcount', 'emoticons'
                          ],
                          toolbar: 'undo redo | formatselect | ' +
                            'bold italic forecolor backcolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | image link | help',
                          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, Roboto, sans-serif; font-size: 14px }',
                          paste_data_images: true,
                          convert_urls: false,
                          branding: false,
                          promotion: false,
                          images_upload_handler: (blobInfo, progress) => new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              if (e.target) {
                                resolve(e.target.result as string);
                              } else {
                                reject('Erreur de lecture de l\'image');
                              }
                            };
                            reader.readAsDataURL(blobInfo.blob());
                          })
                        }}
                      />
                      {!isEditorReady && (
                        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                          Chargement de l'éditeur...
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
