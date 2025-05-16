
import { useState, useEffect } from "react";
import { Request, EmailCampaignRequest, DatabaseRequest, LinkedInScrapingRequest } from "@/types/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailCampaignForm } from "@/components/requests/EmailCampaignForm";
import { DatabaseCreationForm } from "@/components/requests/DatabaseCreationForm";
import { LinkedInScrapingForm } from "@/components/requests/LinkedInScrapingForm";
import { Badge } from "@/components/ui/badge";
import { getMissionName } from "@/services/missionNameService";

interface RequestCompleteEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Request | null;
  onRequestUpdated: () => void;
}

export function RequestCompleteEditDialog({
  open,
  onOpenChange,
  request,
  onRequestUpdated,
}: RequestCompleteEditDialogProps) {
  const [resolvedMissionName, setResolvedMissionName] = useState<string | null>(null);
  
  // Résoudre le nom de mission si nécessaire
  useEffect(() => {
    const resolveName = async () => {
      if (request?.missionId) {
        try {
          const name = await getMissionName(request.missionId);
          console.log(`[RequestCompleteEditDialog] Resolved mission name: ${name}`);
          setResolvedMissionName(name);
        } catch (error) {
          console.error("[RequestCompleteEditDialog] Failed to resolve mission name:", error);
        }
      }
    };
    
    if (open) {
      resolveName();
    }
  }, [open, request?.missionId]);
  
  if (!request) return null;

  // Logs détaillés pour déboguer le problème de nom de mission
  console.log("[RequestCompleteEditDialog] Mission info:", {
    missionId: request.missionId,
    missionName: request.missionName, 
    resolvedName: resolvedMissionName
  });

  // S'assurer que missionId est une chaîne de caractères valide
  const preparedRequest = {
    ...request,
    missionId: request.missionId ? String(request.missionId) : "",
    missionName: resolvedMissionName || request.missionName // Utiliser le nom résolu ou celui de la requête
  };

  console.log("[RequestCompleteEditDialog] Prepared request:", preparedRequest);

  const handleRequestUpdated = () => {
    onOpenChange(false);
    onRequestUpdated();
    toast.success("Demande mise à jour avec succès");
  };

  // Fonction pour obtenir le libellé du type de requête
  const getRequestTypeLabel = (type: string): string => {
    switch(type) {
      case "email": return "Campagne Email";
      case "database": return "Base de données";
      case "linkedin": return "Scraping LinkedIn";
      default: return type;
    }
  };

  // Utiliser le nom de mission résolu ou celui de la requête
  const displayMissionName = resolvedMissionName || request.missionName || "Non assignée";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la demande</DialogTitle>
          <DialogDescription>
            Modifiez tous les aspects de cette demande.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mission</p>
              <p className="text-sm font-semibold">{displayMissionName}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground mb-1">SDR</p>
              <p className="text-sm font-semibold">{request.sdrName || "Non assigné"}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground mb-1">Type</p>
              <Badge variant="outline" className="bg-gray-100">
                {getRequestTypeLabel(request.type)}
              </Badge>
            </div>
          </div>
        </div>

        {request.type === "email" && (
          <EmailCampaignForm 
            editMode={true}
            initialData={preparedRequest as EmailCampaignRequest}
            onSuccess={handleRequestUpdated}
          />
        )}

        {request.type === "database" && (
          <DatabaseCreationForm
            editMode={true}
            initialData={preparedRequest as DatabaseRequest}
            onSuccess={handleRequestUpdated}
          />
        )}

        {request.type === "linkedin" && (
          <LinkedInScrapingForm
            editMode={true}
            initialData={preparedRequest as LinkedInScrapingRequest}
            onSuccess={handleRequestUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
