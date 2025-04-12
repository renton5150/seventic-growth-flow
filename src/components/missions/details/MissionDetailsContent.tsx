
import { Mission } from "@/types/types";
import { MissionDetailsHeader } from "./MissionDetailsHeader";
import { MissionInfoSection } from "./MissionInfoSection";
import { MissionRequestsSection } from "./MissionRequestsSection";

interface MissionDetailsContentProps {
  mission: Mission;
  isSdr: boolean;
}

export const MissionDetailsContent = ({ mission, isSdr }: MissionDetailsContentProps) => {
  console.log("Affichage des détails de mission:", mission);
  console.log("SDR assigné à la mission:", mission.sdrName || "Non assigné");
  
  return (
    <>
      <MissionDetailsHeader mission={mission} />
      <MissionInfoSection mission={mission} />
      <MissionRequestsSection mission={mission} isSdr={isSdr} />
    </>
  );
};
