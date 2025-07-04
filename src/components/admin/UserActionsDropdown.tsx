import { useState } from "react";
import { MoreHorizontal, Key, Trash2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types/types";
import { SimpleChangeRoleDialog } from "./SimpleChangeRoleDialog";
import { DeleteUserDialog } from "./user-actions/DeleteUserDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

interface UserActionsDropdownProps {
  user: User;
  onRefresh: () => void;
}

export const UserActionsDropdown = ({ user, onRefresh }: UserActionsDropdownProps) => {
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir le menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsResetPasswordOpen(true)}>
            <Key className="mr-2 h-4 w-4" />
            Réinitialiser le mot de passe
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsChangeRoleOpen(true)}>
            <UserCog className="mr-2 h-4 w-4" />
            Changer le rôle
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SimpleChangeRoleDialog
        user={user}
        open={isChangeRoleOpen}
        onOpenChange={setIsChangeRoleOpen}
        onRoleChanged={onRefresh}
      />

      <DeleteUserDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        user={user}
        onUserDeleted={onRefresh}
      />

      <ResetPasswordDialog
        user={user}
        open={isResetPasswordOpen}
        onOpenChange={setIsResetPasswordOpen}
      />
    </>
  );
};