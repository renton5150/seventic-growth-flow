
import { useState } from "react";
import { Mission } from "@/types/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, UserPlus, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AssignSDRDialog } from "./AssignSDRDialog";
import { DeleteMissionDialog } from "./DeleteMissionDialog";

interface AdminMissionActionsMenuProps {
  mission: Mission;
  onSuccess?: () => void;
}

export const AdminMissionActionsMenu = ({
  mission,
  onSuccess
}: AdminMissionActionsMenuProps) => {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setIsAssignDialogOpen(true)}
            className="cursor-pointer"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Assigner un SDR</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 cursor-pointer focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Supprimer</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AssignSDRDialog
        mission={mission}
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        onSuccess={() => {
          onSuccess?.();
          toast.success(`SDR assigné à la mission ${mission.name}`);
        }}
      />

      <DeleteMissionDialog
        mission={mission}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={() => {
          onSuccess?.();
          toast.success(`Mission ${mission.name} supprimée`);
        }}
      />
    </>
  );
};
