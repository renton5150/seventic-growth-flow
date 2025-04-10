
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { User } from "@/types/types";
import { ChangeRoleDialog } from "../ChangeRoleDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UserActionMenuItems } from "./UserActionMenuItems";
import { useQueryClient } from "@tanstack/react-query";

interface UserActionsMenuProps {
  user: User;
  onActionComplete: () => void;
}

export const UserActionsMenu = ({ user, onActionComplete }: UserActionsMenuProps) => {
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const queryClient = useQueryClient();

  const handleRoleChanged = () => {
    // Invalidate relevant queries to ensure data is up-to-date
    queryClient.invalidateQueries({ queryKey: ['users'] });
    
    // Notify parent component
    onActionComplete();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Menu d'actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <UserActionMenuItems 
            user={user}
            isSendingInvite={isSendingInvite}
            isDeleting={isDeleting}
            onChangeRole={() => setIsChangeRoleOpen(true)}
            onDelete={() => setIsDeleteDialogOpen(true)}
            setIsSendingInvite={setIsSendingInvite}
            onActionComplete={onActionComplete}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeRoleDialog 
        open={isChangeRoleOpen} 
        onOpenChange={setIsChangeRoleOpen} 
        user={user} 
        onRoleChanged={handleRoleChanged} 
      />

      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={user}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        onUserDeleted={onActionComplete}
      />
    </>
  );
};
