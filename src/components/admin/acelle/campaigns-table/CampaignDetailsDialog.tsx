
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AcelleAccount } from "@/types/acelle.types";
import AcelleCampaignDetails from "../AcelleCampaignDetails";

interface CampaignDetailsDialogProps {
  selectedCampaign: string | null;
  account: AcelleAccount;
  onClose: () => void;
  demoMode: boolean;
}

export function CampaignDetailsDialog({
  selectedCampaign,
  account,
  onClose,
  demoMode
}: CampaignDetailsDialogProps) {
  return (
    <Dialog open={!!selectedCampaign} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedCampaign && "Détails de la campagne"}
          </DialogTitle>
        </DialogHeader>
        {selectedCampaign && (
          <AcelleCampaignDetails 
            campaignId={selectedCampaign} 
            account={account} 
            onClose={onClose}
            demoMode={demoMode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
