
import { Mission, Request } from "@/types/types";
import { RequestsTable } from "@/components/dashboard/requests-table/RequestsTable";

interface MissionRequestsSectionProps {
  mission: Mission;
  isSdr: boolean;
}

export const MissionRequestsSection = ({ mission, isSdr }: MissionRequestsSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Demandes associées</h3>
      {mission.requests && mission.requests.length > 0 ? (
        <RequestsTable 
          requests={mission.requests as Request[]} 
          missionView={true}
          showSdr={!isSdr}
        />
      ) : (
        <p className="text-center py-6 text-gray-500">
          Aucune demande pour cette mission
        </p>
      )}
    </div>
  );
};
