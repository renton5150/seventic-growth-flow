import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import { Mission } from "@/types/types";
import { EventClickArg, EventSourceInput } from "@fullcalendar/core";
import frLocale from "@fullcalendar/core/locales/fr";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const missionColors = [
  { bg: '#8B5CF6', border: '#6D28D9' }, // Violet vif
  { bg: '#EC4899', border: '#BE185D' }, // Rose vif
  { bg: '#F97316', border: '#C2410C' }, // Orange vif
  { bg: '#10B981', border: '#047857' }, // Vert émeraude
  { bg: '#3B82F6', border: '#1D4ED8' }, // Bleu vif
  { bg: '#EF4444', border: '#B91C1C' }, // Rouge
  { bg: '#F59E0B', border: '#B45309' }, // Jaune ambre
  { bg: '#6366F1', border: '#4338CA' }  // Indigo
];

interface PlanningViewProps {
  missions: Mission[];
}

export const PlanningView = ({ missions }: PlanningViewProps) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [calendarApi, setCalendarApi] = useState<any | null>(null);

  const [missionColorMap] = useState(() => {
    const map = new Map<string, { bg: string; border: string }>();
    missions.forEach((mission, index) => {
      map.set(mission.id, missionColors[index % missionColors.length]);
    });
    return map;
  });

  const transformMissionsToEvents = (missions: Mission[]): EventSourceInput => {
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
        textColor: '#ffffff',
        classNames: ['mission-event'],
      };
    });
  };

  const extractResourcesFromMissions = (missions: Mission[]) => {
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

  const handleEventClick = (clickInfo: EventClickArg) => {
    const missionId = clickInfo.event.id;
    navigate(`/admin/missions?id=${missionId}`);
  };

  useEffect(() => {
    if (calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi());
    }
    
    const style = document.createElement('style');
    style.textContent = `
      .mission-event {
        opacity: 1 !important;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
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
            slotDuration: { days: 1 }
          }
        }}
        editable={isAdmin}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        resources={extractResourcesFromMissions(missions)}
        events={transformMissionsToEvents(missions)}
        locale={frLocale}
        height="auto"
        eventClick={handleEventClick}
        eventContent={renderEventContent}
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

function renderEventContent(eventInfo: any) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="fc-event-main-frame cursor-pointer w-full">
          <div className="fc-event-title-container">
            <div className="fc-event-title fc-sticky">
              {eventInfo.event.title}
            </div>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0">
        <Card className="p-4">
          <h3 className="font-bold text-lg">{eventInfo.event.title}</h3>
          <p className="text-muted-foreground">
            Client: {eventInfo.event.extendedProps.client}
          </p>
          <p className="text-muted-foreground">
            Type: {eventInfo.event.extendedProps.type}
          </p>
          {eventInfo.event.extendedProps.description && (
            <p className="text-muted-foreground mt-2">
              {eventInfo.event.extendedProps.description}
            </p>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            {eventInfo.event.start && (
              <p>
                Début: {format(new Date(eventInfo.event.start), 'PPP', { locale: fr })}
              </p>
            )}
            {eventInfo.event.end && (
              <p>
                Fin: {format(new Date(eventInfo.event.end), 'PPP', { locale: fr })}
              </p>
            )}
          </div>
        </Card>
      </HoverCardContent>
    </HoverCard>
  );
}
