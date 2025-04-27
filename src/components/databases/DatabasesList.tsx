
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Database, Download, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { deleteDatabaseFile, downloadFile } from "@/services/database";
import { toast } from "sonner";
import { DatabaseFile } from "@/types/database.types";

interface DatabasesListProps {
  databases: DatabaseFile[];
  isLoading: boolean;
}

export const DatabasesList = ({ databases, isLoading }: DatabasesListProps) => {
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
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMMM yyyy, HH:mm", { locale: fr });
  };
  
  const handleDeleteFile = async (id: string) => {
    try {
      const result = await deleteDatabaseFile(id);
      if (result) {
        toast.success("Base de données supprimée avec succès");
        window.dispatchEvent(new CustomEvent("database-deleted"));
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la base de données:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleFileDownload = async (fileUrl: string, fileName: string) => {
    if (!fileUrl) {
      toast.error("URL du fichier invalide");
      return;
    }
    
    try {
      console.log(`Téléchargement demandé pour: ${fileUrl}, nom: ${fileName}`);
      
      // Afficher un toast de chargement
      const loadingToast = toast.loading("Téléchargement en cours...");
      
      const success = await downloadFile(fileUrl, fileName);
      
      // Supprimer le toast de chargement
      toast.dismiss(loadingToast);
      
      if (!success) {
        toast.error("Erreur lors du téléchargement du fichier");
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error("Erreur lors du téléchargement du fichier");
    }
  };

  return (
    <Card className={getRoleColor()}>
      <CardHeader className={getRoleBgColor()}>
        <CardTitle>Bases de données disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>Chargement des bases de données...</p>
          </div>
        ) : databases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Database className="w-10 h-10 mb-2 text-gray-400" />
            <p className="text-gray-500">Aucune base de données disponible</p>
            <p className="text-sm text-gray-400">
              Téléchargez une nouvelle base de données pour commencer
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom du fichier</TableHead>
                <TableHead>Date d'ajout</TableHead>
                <TableHead>Ajouté par</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {databases.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>{formatDate(file.createdAt)}</TableCell>
                  <TableCell>{file.uploaderName || "Utilisateur"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFileDownload(file.fileUrl, file.name)}
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFile(file.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
