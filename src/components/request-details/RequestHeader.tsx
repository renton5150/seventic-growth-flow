
import { Button } from "@/components/ui/button";
import { ChevronLeft, PenSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GrowthRequestStatusBadge } from "@/components/growth/table/GrowthRequestStatusBadge";
import { Request } from "@/types/types";

interface RequestHeaderProps {
  request: Request;
  onBack: () => void;
  onEdit: () => void;
  canEdit: boolean;
}

export const RequestHeader = ({ request, onBack, onEdit, canEdit }: RequestHeaderProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{request?.title}</h1>
        </div>
        
        {canEdit && (
          <Button 
            variant="default"
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <PenSquare className="h-4 w-4" />
            Modifier la demande
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className="px-2 py-1">
          {request?.type === "email"
            ? "Campagne Email"
            : request?.type === "database"
            ? "Base de données"
            : "Scraping LinkedIn"}
        </Badge>
        {request && (
          <GrowthRequestStatusBadge 
            status={request.workflow_status || "pending_assignment"} 
            isLate={request.isLate}
          />
        )}
      </div>
    </div>
  );
};
