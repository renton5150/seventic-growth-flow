
import { Card } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PlanningEventContentProps {
  event: any;
}

export const PlanningEventContent = ({ event }: PlanningEventContentProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="fc-event-main-frame cursor-pointer w-full">
          <div className="fc-event-title-container">
            <div className="fc-event-title fc-sticky">
              {event.title}
            </div>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0">
        <Card className="p-4">
          <h3 className="font-bold text-lg">{event.title}</h3>
          <p className="text-muted-foreground">
            Client: {event.extendedProps.client}
          </p>
          <p className="text-muted-foreground">
            Type: {event.extendedProps.type}
          </p>
          {event.extendedProps.description && (
            <p className="text-muted-foreground mt-2">
              {event.extendedProps.description}
            </p>
          )}
          <div className="text-xs text-muted-foreground mt-2">
            {event.start && (
              <p>
                Début: {format(new Date(event.start), 'PPP', { locale: fr })}
              </p>
            )}
            {event.end && (
              <p>
                Fin: {format(new Date(event.end), 'PPP', { locale: fr })}
              </p>
            )}
          </div>
        </Card>
      </HoverCardContent>
    </HoverCard>
  );
};
