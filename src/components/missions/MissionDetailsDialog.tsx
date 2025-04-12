
import { Mission, Request } from "@/types/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { RequestsTable } from "@/components/dashboard/requests-table/RequestsTable";

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
  if (!mission) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };

  console.log("Affichage des détails de mission:", mission);
  console.log("SDR assigné à la mission:", mission.sdrName || "Non assigné");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-3">
            {mission.name}
            <Badge variant={mission.type === "Full" ? "default" : "outline"}>
              {mission.type}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Détails de la mission et liste des demandes
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              SDR responsable
            </h3>
            <p>{mission.sdrName || "Non assigné"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Client
            </h3>
            <p>{mission.client || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Date de création
            </h3>
            <p>{formatDate(mission.createdAt)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Date de démarrage
            </h3>
            <p>{formatDate(mission.startDate)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Date de fin
            </h3>
            <p>{formatDate(mission.endDate)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Type de mission
            </h3>
            <p>{mission.type}</p>
          </div>
          {mission.description && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Description
              </h3>
              <p className="text-sm whitespace-pre-wrap">{mission.description}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Demandes associées</h3>
          {mission.requests && mission.requests.length > 0 ? (
            <RequestsTable 
              requests={mission.requests as Request[]} 
              missionView 
              showSdr={!isSdr}
            />
          ) : (
            <p className="text-center py-6 text-gray-500">
              Aucune demande pour cette mission
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
