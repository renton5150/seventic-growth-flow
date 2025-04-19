
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

interface PlanningViewProps {
  missions: Mission[];
}

export const PlanningView = ({ missions }: PlanningViewProps) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [calendarApi, setCalendarApi] = useState<any | null>(null);

  // Transformer les missions en événements pour FullCalendar
  const transformMissionsToEvents = (missions: Mission[]): EventSourceInput => {
    return missions.map(mission => ({
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
      backgroundColor: mission.type === 'Full' ? '#9b87f5' : '#6E59A5',
      borderColor: mission.type === 'Full' ? '#7E69AB' : '#6E59A5',
    }));
  };

  // Créer les ressources (SDR) à partir des missions
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

  // Gestionnaire pour le clic sur un événement
  const handleEventClick = (clickInfo: EventClickArg) => {
    const missionId = clickInfo.event.id;
    navigate(`/admin/missions?id=${missionId}`);
  };

  useEffect(() => {
    if (calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi());
    }
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
          right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
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
          // Vous pouvez ajouter du style aux labels des ressources ici
          info.el.style.fontWeight = 'bold';
        }}
        droppable={isAdmin}
        // Use eventDrop as part of the droppable interactions
        eventDrop={isAdmin ? (info) => {
          toast.success(`Mission ${info.event.title} déplacée`);
          // Ici, vous pourriez appeler votre API pour mettre à jour la mission
          console.log('Mission déplacée:', {
            id: info.event.id,
            newStart: info.event.start,
            newEnd: info.event.end,
            newResourceId: info.newResource?.id
          });
        } : undefined}
        // Use eventResize as part of the resizable interactions
        eventResize={isAdmin ? (info) => {
          toast.success(`Dates de la mission ${info.event.title} modifiées`);
          // Ici, vous pourriez appeler votre API pour mettre à jour la mission
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

// Composant pour afficher le contenu des événements avec une info-bulle au survol
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
