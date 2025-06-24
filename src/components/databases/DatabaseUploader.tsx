
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadDatabaseFile } from "@/services/database";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const DatabaseUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  
  const getRoleColor = () => {
    if (isAdmin) return "border-blue-300";
    if (user?.role === "growth") return "border-green-300";
    return "border-seventic-300";
  };
  
  const getRoleBgColor = () => {
    if (isAdmin) return "bg-blue-50";
    if (user?.role === "growth") return "bg-green-50";
    return "bg-seventic-50";
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Vérifications sur le type de fichier
      const validExtensions = [".csv", ".xlsx", ".xls"];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        setError("Type de fichier non pris en charge. Veuillez sélectionner un fichier CSV, XLS ou XLSX.");
        return;
      }
      
      // Vérification de la taille du fichier (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Fichier trop volumineux. La taille maximale autorisée est de 10MB.");
        return;
      }
      
      console.log("Fichier sélectionné:", selectedFile.name, "Taille:", selectedFile.size, "Type:", selectedFile.type);
      setFile(selectedFile);
    }
  };
  
  const handleUpload = async () => {
    if (!file || !user) return;
    
    try {
      setError(null);
      setUploading(true);
      const loadingToast = toast.loading("Téléversement en cours...");
      
      // Vérifier que le user.id existe avant de l'utiliser
      if (!user.id) {
        toast.dismiss(loadingToast);
        toast.error("Utilisateur non identifié", {
          description: "Veuillez vous reconnecter et réessayer",
        });
        setUploading(false);
        return;
      }
      
      console.log("Téléchargement du fichier:", file.name, "par utilisateur:", user.id);
      const result = await uploadDatabaseFile(file);
      
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success("Base de données téléchargée avec succès");
        setFile(null);
        // Notifier les autres composants que la liste a été mise à jour
        window.dispatchEvent(new CustomEvent("database-uploaded"));
      } else {
        setError(result.error || "Impossible de télécharger la base de données");
        toast.error("Erreur lors du téléchargement", {
          description: result.error || "Impossible de télécharger la base de données",
        });
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement de la base de données:", error);
      setError("Une erreur est survenue lors du téléchargement");
      toast.error("Erreur lors du téléchargement", {
        description: "Une erreur est survenue lors du téléchargement",
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Card className={getRoleColor()}>
      <CardHeader className={getRoleBgColor()}>
        <CardTitle>Télécharger une nouvelle base de données</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                file
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                {file ? (
                  <p className="text-sm text-gray-600 font-semibold">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      CSV, XLS ou XLSX (MAX. 10MB)
                    </p>
                  </>
                )}
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? "Téléchargement en cours..." : "Télécharger la base de données"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
