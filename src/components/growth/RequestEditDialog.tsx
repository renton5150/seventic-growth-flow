import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Request, RequestStatus } from "@/types/types";
import { updateRequest } from "@/services/requestService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { getMissionName } from "@/services/missionNameService";

interface RequestEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequest: Request | null;
  onRequestUpdated: () => void;
}

export function RequestEditDialog({ 
  open, 
  onOpenChange, 
  selectedRequest, 
  onRequestUpdated 
}: RequestEditDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGrowthOrAdmin = user?.role === 'growth' || user?.role === 'admin';
  const [resolvedMissionName, setResolvedMissionName] = useState<string | null>(null);

  // Résoudre le nom de mission si nécessaire
  useEffect(() => {
    const resolveName = async () => {
      if (selectedRequest?.missionId) {
        try {
          const name = await getMissionName(selectedRequest.missionId);
          console.log(`[RequestEditDialog] Resolved mission name: ${name}`);
          setResolvedMissionName(name);
        } catch (error) {
          console.error("[RequestEditDialog] Failed to resolve mission name:", error);
        }
      }
    };
    
    if (open && selectedRequest) {
      resolveName();
    }
  }, [open, selectedRequest]);

  useEffect(() => {
    if (selectedRequest) {
      console.log("[RequestEditDialog] Mission name info:", {
        fromRequest: selectedRequest.missionName,
        resolved: resolvedMissionName
      });
      
      form.reset({
        title: selectedRequest.title,
        dueDate: new Date(selectedRequest.dueDate).toISOString().split('T')[0],
        status: selectedRequest.status as RequestStatus
      });
    }
  }, [selectedRequest]);

  const form = useForm<{
    title: string;
    dueDate: string;
    status: RequestStatus;
  }>({
    defaultValues: {
      title: selectedRequest?.title || "",
      dueDate: selectedRequest?.dueDate 
        ? new Date(selectedRequest.dueDate).toISOString().split('T')[0] 
        : "",
      status: (selectedRequest?.status as RequestStatus) || "pending"
    },
  });

  const handleSaveEdit = (data: { title: string; dueDate: string; status: RequestStatus }) => {
    if (!selectedRequest) return;
    
    try {
      const newDueDate = new Date(data.dueDate);
      
      const updatedRequest = updateRequest(selectedRequest.id, {
        title: data.title,
        dueDate: newDueDate,
        status: data.status
      });
      
      if (updatedRequest) {
        onOpenChange(false);
        onRequestUpdated();
        toast.success("La demande a été modifiée avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la modification de la demande:", error);
      toast.error("Erreur lors de la modification de la demande");
    }
  };

  // Fonction pour accéder à l'édition complète
  const handleViewFullEdit = () => {
    if (!selectedRequest) return;
    navigate(`/requests/${selectedRequest.type}/${selectedRequest.id}/edit`);
    onOpenChange(false);
  };

  // Calcul du type de demande pour l'affichage
  const getRequestTypeLabel = (type?: string): string => {
    if (!type) return "";
    
    switch(type) {
      case "email": return "Campagne Email";
      case "database": return "Base de données";
      case "linkedin": return "Scraping LinkedIn";
      default: return type;
    }
  };
  
  // Utiliser le nom de mission résolu ou celui de la requête
  const displayMissionName = resolvedMissionName || 
                          selectedRequest?.missionName || 
                          "Non assignée";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la demande</DialogTitle>
          <DialogDescription>
            Modifiez les détails de cette demande ou accédez à l'édition complète.
          </DialogDescription>
        </DialogHeader>
        
        {selectedRequest && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                <span className="text-muted-foreground">Mission:</span> {displayMissionName}
              </p>
              <p className="text-sm font-medium">
                <span className="text-muted-foreground">SDR:</span> {selectedRequest.sdrName || "Non assigné"}
              </p>
            </div>
            <p className="text-sm font-medium">
              <span className="text-muted-foreground">Type:</span> {getRequestTypeLabel(selectedRequest.type)}
            </p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveEdit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date prévue</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="inprogress">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <DialogFooter className="flex justify-between pt-2">
              {isGrowthOrAdmin && selectedRequest && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleViewFullEdit}
                >
                  Édition complète
                </Button>
              )}
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
