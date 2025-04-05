
import { useState, useEffect } from "react";
import { getAllDatabases, deleteDatabase, DatabaseFile } from "@/services/databaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

export const DatabasesList = () => {
  const [databases, setDatabases] = useState<DatabaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  
  const loadDatabases = async () => {
    try {
      setLoading(true);
      const data = await getAllDatabases();
      setDatabases(data);
    } catch (error) {
      console.error("Erreur lors du chargement des bases de données:", error);
      toast.error("Erreur", {
        description: "Impossible de charger les bases de données",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadDatabases();
  }, []);
  
  const handleDeleteDatabase = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette base de données?")) {
      try {
        const success = await deleteDatabase(id);
        if (success) {
          toast.success("Base de données supprimée");
          loadDatabases();
        } else {
          toast.error("Erreur", {
            description: "Impossible de supprimer la base de données",
          });
        }
      } catch (error) {
        console.error("Erreur lors de la suppression de la base de données:", error);
        toast.error("Erreur", {
          description: "Impossible de supprimer la base de données",
        });
      }
    }
  };
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const formatDate = (date: Date) => {
    return format(date, "d MMM yyyy à HH:mm", { locale: fr });
  };
  
  // Obtenez la couleur en fonction du rôle de l'utilisateur
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
  
  return (
    <Card className={getRoleColor()}>
      <CardHeader className={getRoleBgColor()}>
        <CardTitle>Bases de données</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <p>Chargement des bases de données...</p>
          </div>
        ) : databases.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Aucune base de données disponible</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Date d'ajout</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {databases.map((db) => (
                <TableRow key={db.id}>
                  <TableCell className="font-medium">{db.name}</TableCell>
                  <TableCell>{formatSize(db.size)}</TableCell>
                  <TableCell>{formatDate(db.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(db.fileUrl, "_blank")}
                      >
                        <Download className="h-4 w-4 mr-1" /> Télécharger
                      </Button>
                      {(isAdmin || user?.id === db.uploadedBy) && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteDatabase(db.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
