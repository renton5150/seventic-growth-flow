
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Request } from "@/types/types";
import { EmailCampaignForm } from "@/components/requests/EmailCampaignForm";

interface RequestCompleteEditDialogProps {
  request: Request;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestUpdated: () => void;
}

export const RequestCompleteEditDialog: React.FC<RequestCompleteEditDialogProps> = ({
  request,
  open,
  onOpenChange,
  onRequestUpdated,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finaliser la demande</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs defaultValue="stats">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="stats">Statistiques</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="mt-4">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Cette fonctionnalité n'est plus disponible.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestCompleteEditDialog;
