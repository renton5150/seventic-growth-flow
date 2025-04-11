
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Trash, Users } from "lucide-react";
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
  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };
  
  return (
    <Card className={`${isAdmin ? "border-blue-300" : "border-seventic-300"}`}>
      <CardHeader className={`${isAdmin ? "bg-blue-50" : "bg-seventic-50"}`}>
        <CardTitle>Liste des missions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>SDR responsable</TableHead>
              <TableHead>Créée le</TableHead>
              <TableHead>Demandes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.map((mission) => (
              <TableRow key={mission.id}>
                <TableCell className="font-medium">{mission.name}</TableCell>
                <TableCell>{mission.client}</TableCell>
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
