
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Mission } from "@/types/types";
import { RequestsTable } from "@/components/dashboard/requests-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MissionDetailsDialogProps {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSdr: boolean;
}

export const MissionDetailsDialog = ({
  mission,
  open,
  onOpenChange,
  isSdr,
}: MissionDetailsDialogProps) => {
  const navigate = useNavigate();

  if (!mission) return null;

  const formatDate = (date: Date) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Détails de la mission: {mission.name}</DialogTitle>
          <DialogDescription>
            SDR responsable: {mission.sdrName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Date de création</p>
              <p>{formatDate(mission.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">SDR responsable</p>
              <p>{mission.sdrName}</p>
            </div>
            {mission.description && (
              <div className="col-span-2 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p>{mission.description}</p>
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-2">Demandes associées</h3>
            {mission.requests.length > 0 ? (
              <RequestsTable requests={mission.requests} missionView={true} />
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Aucune demande n'a encore été créée pour cette mission.
              </p>
            )}
          </div>
          
          {isSdr && (
            <div className="pt-4 flex justify-end">
              <Button onClick={() => {
                onOpenChange(false);
                navigate("/requests/email/new", { state: { missionId: mission.id } });
              }}>
                <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
