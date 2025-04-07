
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { User } from "@/types/types";
import { useState } from "react";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { DeleteUserDialog } from "./dialogs/DeleteUserDialog";
import { UserActionsMenuItems } from "./menu-items/UserActionsMenuItems";
import { useDeleteUser } from "@/hooks/user-actions/useDeleteUser";
import { useSendInvitation } from "@/hooks/user-actions/useSendInvitation";

interface UserActionsMenuProps {
  user: User;
  onActionComplete: () => void;
}

export const UserActionsMenu = ({ user, onActionComplete }: UserActionsMenuProps) => {
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { isDeleting, handleDeleteUser } = useDeleteUser(user, onActionComplete);
  const { isSendingInvite, handleResendInvite } = useSendInvitation(user, onActionComplete);

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
          <UserActionsMenuItems
            isDeleting={isDeleting}
            isSendingInvite={isSendingInvite}
            onChangeRole={() => setIsChangeRoleOpen(true)}
            onResendInvite={handleResendInvite}
            onDelete={() => setIsDeleteDialogOpen(true)}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeRoleDialog 
        open={isChangeRoleOpen} 
        onOpenChange={setIsChangeRoleOpen} 
        user={user} 
        onRoleChanged={onActionComplete} 
      />

      <DeleteUserDialog
        user={user}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        isDeleting={isDeleting}
        onDelete={handleDeleteUser}
      />
    </>
  );
};
