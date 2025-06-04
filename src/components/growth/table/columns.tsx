
import { Button } from "@/components/ui/button";
import { GrowthRequestTypeIcon } from "./GrowthRequestTypeIcon";
import { GrowthRequestStatusBadge } from "./GrowthRequestStatusBadge";
import { GrowthRequestActions } from "./GrowthRequestActions";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Request } from "@/types/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface ColumnDefinition {
  header: string;
  key: string;
  width?: string;
  render: (request: Request) => React.ReactNode;
}

const formatDate = (date: Date | string) => {
  // Ensure we have a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  return format(dateObj, "d MMM yyyy", { locale: fr });
};

const getRequestTypeLabel = (type: string): string => {
  switch(type) {
    case "email": return "Campagne Email";
    case "database": return "Base de données";
    case "linkedin": return "Scraping LinkedIn";
    default: return type;
  }
};

export const columns: ColumnDefinition[] = [
  // Type
  {
    header: "Type",
    key: "type",
    width: "w-[50px]",
    render: (request) => <GrowthRequestTypeIcon type={request.type} />
  },
  // Mission - CORRECTION RADICALE
  {
    header: "Mission",
    key: "mission",
    render: (request) => {
      // Essayer plusieurs sources pour le nom de mission
      let displayName = "Sans mission";
      
      // 1. Essayer missionName directement
      if (request.missionName && request.missionName.trim() !== "" && request.missionName !== "Sans mission") {
        displayName = request.missionName.trim();
        console.log(`[Column Mission] Utilisation missionName: "${displayName}" pour request ${request.id}`);
      }
      // 2. Essayer dans les détails
      else if (request.details?.missionName && request.details.missionName.trim() !== "") {
        displayName = request.details.missionName.trim();
        console.log(`[Column Mission] Utilisation details.missionName: "${displayName}" pour request ${request.id}`);
      }
      // 3. Essayer mission_name (format snake_case)
      else if ((request as any).mission_name && (request as any).mission_name.trim() !== "") {
        displayName = (request as any).mission_name.trim();
        console.log(`[Column Mission] Utilisation mission_name: "${displayName}" pour request ${request.id}`);
      }
      // 4. Essayer mission_client
      else if ((request as any).mission_client && (request as any).mission_client.trim() !== "") {
        displayName = (request as any).mission_client.trim();
        console.log(`[Column Mission] Utilisation mission_client: "${displayName}" pour request ${request.id}`);
      }
      
      console.log(`[Column Mission] FINAL pour request ${request.id}: "${displayName}"`);
      console.log(`[Column Mission] DEBUG request ${request.id}:`, {
        missionName: request.missionName,
        mission_name: (request as any).mission_name,
        mission_client: (request as any).mission_client,
        details_missionName: request.details?.missionName,
        full_request: request
      });
      
      return (
        <div className="font-medium text-sm" title={displayName}>
          {displayName}
        </div>
      );
    }
  },
  // Type de demande
  {
    header: "Type de demande",
    key: "requestType",
    width: "w-[150px]",
    render: (request) => (
      <Badge variant="outline" className="bg-gray-100">
        {getRequestTypeLabel(request.type)}
      </Badge>
    )
  },
  // Titre de la demande
  {
    header: "Titre de la demande",
    key: "title",
    render: (request) => (
      <div className="font-medium text-sm max-w-[200px] truncate" title={request.title}>
        {request.title}
      </div>
    )
  },
  // SDR
  {
    header: "SDR",
    key: "sdr",
    render: (request) => (
      <div className="flex items-center">
        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
        {request.sdrName || "Non assigné"}
      </div>
    )
  },
  // Assigné à
  {
    header: "Assigné à",
    key: "assignedTo",
    render: (request) => (
      <div className="flex items-center">
        <Users className="mr-1 h-4 w-4 text-muted-foreground" />
        {request.assignedToName || "Non assigné"}
      </div>
    )
  },
  // Plateforme d'emailing
  {
    header: "Plateforme d'emailing",
    key: "emailPlatform",
    render: (request) =>
      request.type === "email" && request.details?.emailPlatform
        ? (
          <Badge variant="outline" className="bg-violet-50 text-violet-600">
            {request.details.emailPlatform}
          </Badge>
        ) : (
          <span className="text-muted-foreground">–</span>
        ),
  },
  // Créée le
  {
    header: "Créée le",
    key: "createdAt",
    render: (request) => formatDate(request.createdAt)
  },
  // Date prévue
  {
    header: "Date prévue",
    key: "dueDate",
    render: (request) => formatDate(request.dueDate)
  },
  // Statut
  {
    header: "Statut",
    key: "status",
    render: (request) => (
      <GrowthRequestStatusBadge 
        status={request.workflow_status || "pending_assignment"} 
        isLate={request.isLate} 
      />
    )
  },
];
