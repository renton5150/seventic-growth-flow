import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadDatabaseFile } from "@/services/database";

export const DatabaseUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (
        selectedFile.type !== "text/csv" &&
        selectedFile.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
        !selectedFile.name.endsWith(".csv") &&
        !selectedFile.name.endsWith(".xlsx")
      ) {
        toast.error("Type de fichier non pris en charge", {
          description: "Veuillez sélectionner un fichier CSV ou XLSX",
        });
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("Fichier trop volumineux", {
          description: "La taille maximale autorisée est de 10MB",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleUpload = async () => {
    if (!file || !user) return;
    
    try {
      setUploading(true);
      
      // Vérifier que le user.id existe avant de l'utiliser
      if (!user.id) {
        toast.error("Utilisateur non identifié", {
          description: "Veuillez vous reconnecter et réessayer",
        });
        setUploading(false);
        return;
      }
      
      console.log("Téléchargement du fichier:", file.name, "par utilisateur:", user.id);
      const result = await uploadDatabaseFile(file, user.id);
      
      if (result) {
        toast.success("Base de données téléchargée avec succès");
        setFile(null);
        window.dispatchEvent(new CustomEvent("database-uploaded"));
      } else {
        toast.error("Erreur lors du téléchargement", {
          description: "Impossible de télécharger la base de données",
        });
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement de la base de données:", error);
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
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                file
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              }`}
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
                      CSV ou XLSX (MAX. 10MB)
                    </p>
                  </>
                )}
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                accept=".csv,.xlsx"
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
