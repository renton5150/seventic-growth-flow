
import { Mission } from "@/types/types";
import { EventSourceInput } from "@fullcalendar/core";
import { createMissionColorMap, missionColors } from "../utils/missionColors";

export const usePlanningCalendar = (missions: Mission[]) => {
  const transformMissionsToEvents = (): EventSourceInput => {
    const missionColorMap = createMissionColorMap(missions);
    
    return missions.map(mission => {
      const colors = missionColorMap.get(mission.id) || missionColors[0];
      
      return {
        id: mission.id,
        title: mission.name,
        start: mission.startDate,
        end: mission.endDate || undefined,
        resourceId: mission.sdrId,
        extendedProps: {
          client: mission.name,
          type: mission.type,
          description: mission.description || '',
        },
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.textColor,
        classNames: ['mission-event'],
      };
    });
  };

  const extractResourcesFromMissions = () => {
    const uniqueResources = new Map();
    
    missions.forEach(mission => {
      if (mission.sdrId && !uniqueResources.has(mission.sdrId)) {
        uniqueResources.set(mission.sdrId, {
          id: mission.sdrId,
          title: mission.sdrName || 'SDR inconnu'
        });
      }
    });
    
    return Array.from(uniqueResources.values());
  };

  return {
    transformMissionsToEvents,
    extractResourcesFromMissions,
  };
};
