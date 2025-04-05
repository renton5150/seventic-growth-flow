
import { useState } from "react";
import { Control } from "react-hook-form";
import { Upload, Link } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/requests/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import { uploadDatabaseFile } from "@/services/databaseService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DatabaseSectionProps {
  control: Control<any>;
  handleFileUpload: (field: string, files: FileList | null | string) => void;
}

export const DatabaseSection = ({ 
  control, 
  handleFileUpload 
}: DatabaseSectionProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleDatabaseFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      handleFileUpload("databaseFileUrl", null);
      return;
    }

    const file = files[0];
    
    // Vérifier le type de fichier
    const allowedTypes = [
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "text/csv", // .csv
      "application/csv", // .csv (certains navigateurs)
      "text/plain", // .csv parfois détecté comme text/plain
    ];

    // Vérification simple de l'extension car les types MIME peuvent être incohérents
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = extension === 'xls' || extension === 'xlsx' || extension === 'csv';

    if (!isValidType) {
      toast.error("Format de fichier non pris en charge. Utilisez XLS, XLSX ou CSV.");
      return;
    }

    // Vérifier la taille du fichier (max 50Mo)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 50Mo)");
      return;
    }

    try {
      setUploading(true);

      if (user) {
        // Si connecté à Supabase, tenter un vrai téléchargement
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
          const uploaded = await uploadDatabaseFile(file, user.id);
          if (uploaded) {
            toast.success(`Fichier ${file.name} téléchargé avec succès`);
            // Utiliser une chaîne de caractères pour l'URL du fichier
            handleFileUpload("databaseFileUrl", `uploads/${file.name}`);
          } else {
            toast.error("Échec du téléchargement du fichier");
          }
        } else {
          // Mode démo - simuler un téléchargement
          setTimeout(() => {
            toast.success(`Fichier ${file.name} téléchargé avec succès (mode démo)`);
            // En mode démo, on simule une URL
            handleFileUpload("databaseFileUrl", `uploads/${file.name}`);
            
            // Déclencher l'événement d'upload réussi
            const event = new CustomEvent('database-uploaded');
            window.dispatchEvent(event);
          }, 1500);
        }
      } else {
        toast.error("Vous devez être connecté pour télécharger des fichiers");
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du fichier");
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
