
import { Mission } from "@/types/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MissionInfoSectionProps {
  mission: Mission;
}

export const MissionInfoSection = ({ mission }: MissionInfoSectionProps) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">
          SDR responsable
        </h3>
        <p>{mission.sdrName || "Non assigné"}</p>
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
  );
};
