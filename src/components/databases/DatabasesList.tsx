
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Database, Download, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { deleteDatabaseFile } from "@/services/database";
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

  // Fonction pour télécharger un fichier
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    if (!fileUrl) return;
    
    // Cas 1: URL complète (http/https)
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      window.open(fileUrl, '_blank');
      return;
    }
    
    // Cas 2: Chemin local (pour les chemins simulés en mode démo)
    const element = document.createElement('a');
    
    // Déterminer le type de fichier à partir de l'extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    let mimeType = 'application/octet-stream';
    
    if (fileExtension === 'xlsx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (fileExtension === 'xls') {
      mimeType = 'application/vnd.ms-excel';
    } else if (fileExtension === 'csv') {
      mimeType = 'text/csv';
    }
    
    // Créer un contenu approprié selon le type de fichier
    let fileContent;
    
    if (fileExtension === 'csv') {
      // En-tête CSV minimal valide
      fileContent = 'Column1,Column2,Column3\nValue1,Value2,Value3';
    } else {
      // Pour les fichiers Excel, utilisons un arraybuffer avec un en-tête minimal
      fileContent = new Uint8Array([
        0x50, 0x4B, 0x03, 0x04, // Signature pour les fichiers XLSX (ZIP)
        0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
    }
    
    const blob = new Blob([fileContent], { type: mimeType });
    element.href = URL.createObjectURL(blob);
    element.download = fileName || fileUrl.split('/').pop() || "database.xlsx";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Libérer l'URL créée
    setTimeout(() => {
      URL.revokeObjectURL(element.href);
    }, 100);
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
