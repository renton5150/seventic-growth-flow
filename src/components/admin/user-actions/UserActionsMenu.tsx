
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { User } from "@/types/types";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UserActionMenuItems } from "./UserActionMenuItems";

interface UserActionsMenuProps {
  user: User;
  onActionComplete: () => void;
}

export const UserActionsMenu = ({ user, onActionComplete }: UserActionsMenuProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Simplify by removing complex state management that's causing issues
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Menu d'actions pour l'utilisateur"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Menu d'actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <UserActionMenuItems 
            user={user}
            onDelete={() => setIsDeleteDialogOpen(true)}
            onActionComplete={onActionComplete}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={user}
        onUserDeleted={onActionComplete}
      />
    </>
  );
};
