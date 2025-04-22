
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
  {
    header: "Type",
    key: "type",
    width: "w-[50px]",
    render: (request) => <GrowthRequestTypeIcon type={request.type} />
  },
  {
    header: "Titre",
    key: "title",
    width: "w-[220px]",
    render: (request) => <div className="font-medium">{request.title}</div>
  },
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
  {
    header: "Mission",
    key: "mission",
    render: (request) => (
      <div className="font-medium text-sm">
        {request.missionName || "Sans mission"}
      </div>
    )
  },
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
  {
    header: "Créée le",
    key: "createdAt",
    render: (request) => formatDate(request.createdAt)
  },
  {
    header: "Date prévue",
    key: "dueDate",
    render: (request) => formatDate(request.dueDate)
  },
  {
    header: "Statut",
    key: "status",
    render: (request) => (
      <GrowthRequestStatusBadge 
        status={request.workflow_status || "pending_assignment"} 
        isLate={request.isLate} 
      />
    )
  }
];
