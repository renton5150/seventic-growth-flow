
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mission } from "@/types/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { UserPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AssignSDRDialog } from "./AssignSDRDialog";
import { DeleteMissionDialog } from "./DeleteMissionDialog";
import { toast } from "sonner";

interface MissionDetailsDialogProps {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSdr?: boolean;
  isAdmin?: boolean;
  onMissionUpdated?: () => void;
}

export const MissionDetailsDialog = ({
  mission,
  open,
  onOpenChange,
  isSdr = false,
  isAdmin = false,
  onMissionUpdated
}: MissionDetailsDialogProps) => {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!mission) {
    return null;
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };

  const handleSuccessfulAction = () => {
    onOpenChange(false);
    onMissionUpdated?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mission.name}</DialogTitle>
            <DialogDescription className="flex flex-col gap-2">
              <div><span className="font-semibold">Client:</span> {mission.client}</div>
              <div><span className="font-semibold">SDR:</span> {mission.sdrName || "Non assigné"}</div>
              <div><span className="font-semibold">Créée le:</span> {formatDate(mission.createdAt)}</div>
              {mission.description && (
                <div>
                  <span className="font-semibold">Description:</span> 
                  <p className="mt-1">{mission.description}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h3 className="font-semibold mb-2">Demandes associées</h3>
            {mission.requests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mission.requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.title}</TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>{request.status}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Aucune demande pour cette mission.</p>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <Button 
                    variant="outline"
                    className="flex items-center"
                    onClick={() => setIsAssignDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assigner un SDR
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </>
              )}
            </div>
            
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isAdmin && mission && (
        <>
          <AssignSDRDialog
            mission={mission}
            open={isAssignDialogOpen}
            onOpenChange={setIsAssignDialogOpen}
            onSuccess={() => {
              handleSuccessfulAction();
              toast.success(`SDR assigné à la mission ${mission.name}`);
            }}
          />

          <DeleteMissionDialog
            mission={mission}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={() => {
              handleSuccessfulAction();
              toast.success(`Mission ${mission.name} supprimée`);
            }}
          />
        </>
      )}
    </>
  );
};
