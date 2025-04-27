
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Request } from "@/types/types";
import EmailCampaignForm from "@/components/requests/EmailCampaignForm";

interface RequestCompleteEditDialogProps {
  request: Request;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const RequestCompleteEditDialog = ({
  request,
  isOpen,
  onClose,
  onComplete,
}: RequestCompleteEditDialogProps) => {
  const handleComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compléter la demande</DialogTitle>
          <DialogDescription>
            Ajoutez les résultats finaux pour compléter cette demande
          </DialogDescription>
        </DialogHeader>

        {request.type === "email" && <EmailCampaignForm />}
        
        <div className="flex justify-end space-x-4 mt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleComplete}>
            Marquer comme terminé
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
