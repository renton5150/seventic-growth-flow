
import { Mission } from "@/types/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MissionDetailsContent } from "./details";

interface MissionDetailsDialogProps {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSdr: boolean;
}

export const MissionDetailsDialog = ({
  mission,
  open,
  onOpenChange,
  isSdr,
}: MissionDetailsDialogProps) => {
  if (!mission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <MissionDetailsContent mission={mission} isSdr={isSdr} />
      </DialogContent>
    </Dialog>
  );
};
