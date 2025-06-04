
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

// Fonction pour obtenir le nom de la mission directement depuis l'ID - MAPPING COMPLET
const getMissionNameFromId = (missionId: string | undefined): string => {
  // Mapping COMPLET des IDs de mission vers leurs noms
  const missionNames: Record<string, string> = {
    "57763c8d-71b6-4e2d-9adf-94d8abbb4d2b": "Freshworks",
    "57763c8d-fa72-433e-9f9e-5511a6a56062": "Freshworks",
    "124ea847-cf3f-44af-becb-75641ebf0ef1": "Koezio",
    "d5e2e830-3f9d-4772-ba66-ae839d98c764": "Ubcom",
    "cf9961bd-2bb5-41a0-bb22-3f42099d0129": "Cityscoot",
    "30ecd8fe-61a2-478d-973f-3924d9d238a0": "Partoo",
    "74bc5f88-bc0f-4274-8362-1cf309121f61": "JobTeaser",
    "270434e3-c0e0-4d49-9666-d06e39661056": "PayFit",
    "5d495536-bc18-44fe-bf62-0c6d93cf865f": "Storelift",
    "9d2aa86f-b4a7-4105-9044-6c6f1df5d183": "Airthium",
    "41439bcc-ebb4-49dc-bed3-26f5764226d7": "Matera",
    "57bb236e-e39f-4b02-a661-c70ecca11ad0": "Watchdog"
  };
  
  if (!missionId) return "Sans mission";
  return missionNames[missionId] || "Mission inconnue";
};

export const columns: ColumnDefinition[] = [
  // Type
  {
    header: "Type",
    key: "type",
    width: "w-[50px]",
    render: (request) => <GrowthRequestTypeIcon type={request.type} />
  },
  // Mission - NOUVELLE COLONNE AVEC NOMS RÉELS
  {
    header: "Mission",
    key: "mission",
    render: (request) => (
      <div className="font-medium text-sm">
        {getMissionNameFromId(request.missionId)}
      </div>
    )
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
  // NOUVELLE COLONNE: Titre de la demande
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
