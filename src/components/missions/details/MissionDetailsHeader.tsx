
import { Mission } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MissionDetailsHeaderProps {
  mission: Mission;
}

export const MissionDetailsHeader = ({ mission }: MissionDetailsHeaderProps) => {
  return (
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
  );
};
