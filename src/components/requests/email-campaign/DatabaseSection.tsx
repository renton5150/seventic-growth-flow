
import { useState } from "react";
import { Control } from "react-hook-form";
import { Upload, Link } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/requests/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { uploadDatabaseFile } from "@/services/database";

interface DatabaseSectionProps {
  control: Control<any>;
  handleFileUpload: (field: string, files: FileList | null | string) => void;
}

export const DatabaseSection = ({ 
  control, 
  handleFileUpload 
}: DatabaseSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<number>>(new Set());
  const { user } = useAuth();

  const handleMultipleDatabaseFileUpload = async (
    files: FileList | null | string, 
    currentFiles: string[], 
    onChange: (files: string[]) => void
  ) => {
    if (!files || typeof files === 'string' || files.length === 0) {
      return;
    }

    const file = files[0];
    
    // Vérifier l'extension du fichier
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['csv', 'xls', 'xlsx'];
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      toast.error("Format de fichier non supporté. Utilisez CSV, XLS ou XLSX.");
      return;
    }

    // Vérifier la taille du fichier (max 50Mo)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 50Mo)");
      return;
    }

    if (!user || !user.id) {
      toast.error("Vous devez être connecté pour télécharger un fichier");
      return;
    }

    try {
      setUploading(true);
      const fileIndex = currentFiles.length;
      setUploadingFiles(prev => new Set(prev).add(fileIndex));
      
      toast.loading("Téléchargement en cours...", { id: "file-upload" });
      
      const result = await uploadDatabaseFile(file);
      
      toast.dismiss("file-upload");
      
      if (result.success && result.fileUrl) {
        const newFiles = [...currentFiles, result.fileUrl];
        onChange(newFiles);
        toast.success(`Fichier ${file.name} téléchargé avec succès`);
        
        // Déclencher l'événement pour actualiser la liste des bases de données
        window.dispatchEvent(new CustomEvent('database-uploaded'));
      } else {
        toast.error(`Erreur lors du téléchargement du fichier: ${result.error || "Erreur inconnue"}`);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du fichier");
      toast.dismiss("file-upload");
    } finally {
      setUploading(false);
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentFiles.length);
        return newSet;
      });
    }
  };

  const handleRemoveFile = (index: number, currentFiles: string[], onChange: (files: string[]) => void) => {
    const newFiles = currentFiles.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const getFileName = (url: string): string => {
    if (!url) return "";
    
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
      return "fichier";
    }
  };

  return (
    <Card className="border-t-4 border-t-seventic-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Base de données</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-sm mb-2">Fichiers</h4>
            <FormField
              control={control}
              name="databaseFileUrls"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-4">
                      {/* Fichiers existants */}
                      {field.value && field.value.length > 0 && (
                        <div className="space-y-2">
                          {field.value.map((fileUrl: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                              <div className="flex-1">
                                <span className="text-sm font-medium">{getFileName(fileUrl)}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index, field.value || [], field.onChange)}
                                className="text-red-500 hover:text-red-700 p-1"
                                disabled={uploading}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Uploader pour nouveau fichier */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <FileUploader
                          icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                          title={uploading ? "Téléchargement en cours..." : "Ajouter une base de données"}
                          description="Formats acceptés : XLS, XLSX, CSV (Max 50 Mo)"
                          value={undefined}
                          onChange={(files) => handleMultipleDatabaseFileUpload(files, field.value || [], field.onChange)}
                          accept=".xls,.xlsx,.csv"
                          maxSize={50}
                          disabled={uploading}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm mb-2">Liens web</h4>
            {[0, 1, 2, 3, 4].map((index) => (
              <FormField
                key={index}
                control={control}
                name={`databaseWebLinks.${index}`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Link className="h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder={`Lien web ${index + 1}`}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Notes</h4>
            <FormField
              control={control}
              name="databaseNotes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="Donnez des indications sur la base à utiliser" 
                      className="min-h-[100px]"
                      {...field} 
                    />
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
