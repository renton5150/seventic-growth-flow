
import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MissionForm } from "@/components/missions/form/MissionForm";
import { Mission } from "@/types/types";

interface MissionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mission?: Mission | null;
  selectedDate?: Date | null;
  onSave: () => void;
}

export const MissionEditDialog: React.FC<MissionEditDialogProps> = ({
  isOpen,
  onClose,
  mission,
  selectedDate,
  onSave
}) => {
  const isEditing = !!mission;

  const handleSuccess = () => {
    onSave();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Modifier "${mission.name}"` : "Nouvelle mission"}
          </DialogTitle>
        </DialogHeader>
        
        <MissionForm
          mission={mission}
          defaultStartDate={selectedDate}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
