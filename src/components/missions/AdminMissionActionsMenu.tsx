
import { useState } from "react";
import { Mission } from "@/types/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssignSDRDialog } from "./AssignSDRDialog";
import { DeleteMissionDialog } from "./DeleteMissionDialog";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();

  const handleMissionDeleted = () => {
    console.log("Mission supprimée, début du processus de mise à jour");
    
    // Forcer une invalidation et un rechargement complet des données
    queryClient.invalidateQueries({ queryKey: ['missions'] });
    
    // Appeler le callback de succès si fourni
    if (onSuccess) {
      console.log("Appel du callback onSuccess après suppression");
      onSuccess();
    }
  };

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
            onClick={() => {
              console.log("Ouverture du dialogue de suppression pour mission:", mission.id);
              setIsDeleteDialogOpen(true);
            }}
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
          queryClient.invalidateQueries({ queryKey: ['missions'] });
          onSuccess?.();
          toast.success(`SDR assigné à la mission ${mission.name}`);
        }}
      />

      <DeleteMissionDialog
        mission={mission}
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          console.log(`Changement d'état de la boîte de dialogue de suppression: ${open}`);
          setIsDeleteDialogOpen(open);
        }}
        onDeleted={handleMissionDeleted}
        onSuccess={handleMissionDeleted}
      />
    </>
  );
};
