
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request } from "@/types/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RequestTimelineProps {
  request: Request;
}

export const RequestTimeline: React.FC<RequestTimelineProps> = ({ request }) => {
  // Generate timeline events based on request data
  const generateTimelineEvents = () => {
    const events = [];
    
    // Creation event
    if (request.created_at) {
      events.push({
        date: new Date(request.created_at),
        title: "Demande créée",
        description: `La demande a été créée${request.created_by_name ? ` par ${request.created_by_name}` : ""}.`
      });
    }
    
    // Assignment event
    if (request.assigned_to_name) {
      events.push({
        date: new Date(request.updated_at || request.created_at), // Approximate
        title: "Assignation",
        description: `La demande a été assignée à ${request.assigned_to_name}.`
      });
    }
    
    // Status change events
    if (request.status === "in_progress") {
      events.push({
        date: new Date(request.last_updated || request.updated_at || request.created_at),
        title: "Traitement en cours",
        description: "La demande est en cours de traitement."
      });
    }
    
    if (request.status === "completed") {
      events.push({
        date: new Date(request.last_updated || request.updated_at || request.created_at),
        title: "Demande terminée",
        description: "La demande a été complétée avec succès."
      });
    }
    
    if (request.status === "canceled") {
      events.push({
        date: new Date(request.last_updated || request.updated_at || request.created_at),
        title: "Demande annulée",
        description: "La demande a été annulée."
      });
    }
    
    // Sort by date
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const timelineEvents = generateTimelineEvents();

  const formatDateTime = (date: Date) => {
    return format(date, "d MMMM yyyy à HH:mm", { locale: fr });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique</CardTitle>
      </CardHeader>
      <CardContent>
        {timelineEvents.length > 0 ? (
          <div className="space-y-6">
            {timelineEvents.map((event, index) => (
              <div key={index} className="relative pl-6 pb-6">
                <div className="absolute left-0 top-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-[3px] top-3 w-[1px] h-[calc(100%-6px)] bg-muted"></div>
                )}
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">{formatDateTime(event.date)}</p>
                  <p className="mt-1">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucun historique disponible</p>
        )}
      </CardContent>
    </Card>
  );
};
