
import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import { Mission } from "@/types/types";
import { EventClickArg } from "@fullcalendar/core";
import frLocale from "@fullcalendar/core/locales/fr";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PlanningEventContent } from "./PlanningEventContent";
import { usePlanningCalendar } from "./hooks/usePlanningCalendar";
import { addCalendarStyles } from "./utils/calendarStyles";

interface PlanningViewProps {
  missions: Mission[];
}

export const PlanningView = ({ missions }: PlanningViewProps) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [calendarApi, setCalendarApi] = useState<any | null>(null);
  const { transformMissionsToEvents, extractResourcesFromMissions } = usePlanningCalendar(missions);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const missionId = clickInfo.event.id;
    navigate(`/admin/missions?id=${missionId}`);
  };

  useEffect(() => {
    if (calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi());
    }
    
    const removeStyles = addCalendarStyles();
    return () => removeStyles();
  }, []);

  return (
    <div className="planning-container border rounded-md overflow-hidden">
      <FullCalendar
        ref={calendarRef}
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        initialView="resourceTimelineMonth"
        headerToolbar={{
          left: 'today prev,next',
          center: 'title',
          right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth,resourceTimelineQuarter'
        }}
        views={{
          resourceTimelineQuarter: {
            type: 'resourceTimeline',
            duration: { months: 3 },
            buttonText: 'Trimestre',
            slotDuration: { days: 1 },
            slotMinWidth: 15, // Réduire la largeur minimale des slots
            contentHeight: 'auto', // Hauteur automatique
            stickyHeaderDates: true, // Garder les dates visibles lors du défilement
            expandRows: true // Étendre les lignes pour remplir la hauteur disponible
          }
        }}
        contentHeight="auto"
        editable={isAdmin}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        resources={extractResourcesFromMissions()}
        events={transformMissionsToEvents()}
        locale={frLocale}
        height="auto"
        eventClick={handleEventClick}
        eventContent={PlanningEventContent}
        slotDuration={{ days: 1 }}
        slotLabelFormat={[
          { month: 'long', year: 'numeric' },
          { day: 'numeric' }
        ]}
        resourceLabelDidMount={(info) => {
          info.el.style.fontWeight = 'bold';
        }}
        droppable={isAdmin}
        eventDrop={isAdmin ? (info) => {
          toast.success(`Mission ${info.event.title} déplacée`);
          console.log('Mission déplacée:', {
            id: info.event.id,
            newStart: info.event.start,
            newEnd: info.event.end,
            newResourceId: info.newResource?.id
          });
        } : undefined}
        eventResize={isAdmin ? (info) => {
          toast.success(`Dates de la mission ${info.event.title} modifiées`);
          console.log('Mission redimensionnée:', {
            id: info.event.id,
            newStart: info.event.start,
            newEnd: info.event.end
          });
        } : undefined}
      />
    </div>
  );
};
