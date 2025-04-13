
import { Mission, MissionStatus } from "@/types/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarClock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionCardProps {
  mission: Mission;
  className?: string;
}

export const MissionCard = ({ mission, className }: MissionCardProps) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "Non définie";
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };

  // Déterminer la variante du badge
  const getBadgeVariant = (status: MissionStatus) => {
    if (status === "Terminé") {
      return "success";
    }
    // En cours est le statut par défaut
    return "default";
  };

  return (
    <Card className={cn("w-full shadow-sm transition-all hover:shadow-md", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{mission.name}</CardTitle>
            <CardDescription>
              {mission.type === "Full" ? "Mission complète" : "Mission partielle"}
            </CardDescription>
          </div>
          <Badge variant={getBadgeVariant(mission.status) as "default" | "success"}>{mission.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mission.description && (
          <div className="text-sm whitespace-pre-wrap text-muted-foreground">
            {mission.description}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center space-x-2 text-sm">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Début:</span>
            <span className="font-medium">{formatDate(mission.startDate)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Fin:</span>
            <span className="font-medium">{formatDate(mission.endDate)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center text-sm">
          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-muted-foreground mr-2">SDR:</span>
          <span className="font-medium">{mission.sdrName || "Non assigné"}</span>
        </div>
      </CardFooter>
    </Card>
  );
};
