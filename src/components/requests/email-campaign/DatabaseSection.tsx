
import { useState } from "react";
import { Control } from "react-hook-form";
import { Upload, Link } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  const { user } = useAuth();

  const handleDatabaseFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      handleFileUpload("databaseFileUrl", null);
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
      toast.loading("Téléchargement en cours...", { id: "file-upload" });
      
      const result = await uploadDatabaseFile(file, user.id);
      
      toast.dismiss("file-upload");
      
      if (result.success && result.fileUrl) {
        toast.success(`Fichier ${file.name} téléchargé avec succès`);
        handleFileUpload("databaseFileUrl", result.fileUrl);
        
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
    }
  };

  return (
    <Card className="border-t-4 border-t-seventic-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Base de données</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-sm mb-2">Fichier</h4>
            <FormField
              control={control}
              name="databaseFileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUploader
                      icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                      title={uploading ? "Téléchargement en cours..." : "Importer votre base de données"}
                      description="Formats acceptés : XLS, XLSX, CSV (Max 50 Mo)"
                      value={field.value}
                      onChange={handleDatabaseFileUpload}
                      accept=".xls,.xlsx,.csv"
                      maxSize={50}
                      disabled={uploading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Lien web</h4>
            <FormField
              control={control}
              name="databaseWebLink"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Link className="h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="https://example.com/database" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
