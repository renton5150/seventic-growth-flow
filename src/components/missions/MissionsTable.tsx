
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowDown, ArrowUp, FileText, Trash, Users } from "lucide-react";
import { Mission } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface MissionsTableProps {
  missions: Mission[];
  isAdmin: boolean;
  onViewMission: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
}

export const MissionsTable = ({ 
  missions, 
  isAdmin, 
  onViewMission,
  onDeleteMission 
}: MissionsTableProps) => {
  // État pour le tri
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };
  
  // Fonction pour gérer le tri lorsqu'on clique sur un en-tête
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nouvelle colonne, commencer par tri ascendant
      setSortColumn(column);
      setSortDirection("asc");
    }
  };
  
  // Composant pour les en-têtes triables
  const SortableHead = ({ column, children }: { column: string, children: React.ReactNode }) => {
    const isActive = sortColumn === column;
    
    return (
      <TableHead 
        onClick={() => handleSort(column)}
        className="cursor-pointer hover:bg-muted/30"
        aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
        tabIndex={0}
      >
        <div className="flex items-center gap-2">
          {children}
          {isActive && (
            sortDirection === "asc" 
              ? <ArrowUp className="h-4 w-4" /> 
              : <ArrowDown className="h-4 w-4" />
          )}
        </div>
      </TableHead>
    );
  };
  
  // Appliquer le tri avec useMemo pour optimiser les performances
  const sortedMissions = useMemo(() => {
    return [...missions].sort((a, b) => {
      const factor = sortDirection === "asc" ? 1 : -1;
      
      switch (sortColumn) {
        case "name":
          return a.name.localeCompare(b.name) * factor;
        case "sdr":
          return (a.sdrName || "").localeCompare(b.sdrName || "") * factor;
        case "createdAt":
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor;
        case "requests":
          return (a.requests.length - b.requests.length) * factor;
        default:
          return 0;
      }
    });
  }, [missions, sortColumn, sortDirection]);
  
  return (
    <Card className={`${isAdmin ? "border-blue-300" : "border-seventic-300"}`}>
      <CardHeader className={`${isAdmin ? "bg-blue-50" : "bg-seventic-50"}`}>
        <CardTitle>Liste des missions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead column="name">Nom</SortableHead>
              <SortableHead column="sdr">SDR responsable</SortableHead>
              <SortableHead column="createdAt">Créée le</SortableHead>
              <SortableHead column="requests">Demandes</SortableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMissions.map((mission) => (
              <TableRow key={mission.id}>
                <TableCell className="font-medium">{mission.name}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    {mission.sdrName}
                  </div>
                </TableCell>
                <TableCell>{formatDate(mission.createdAt)}</TableCell>
                <TableCell>{mission.requests.length}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewMission(mission)}
                      className={isAdmin ? "border-blue-500 hover:bg-blue-50" : ""}
                    >
                      Voir
                    </Button>
                    
                    {isAdmin && onDeleteMission && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onDeleteMission(mission)}
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
