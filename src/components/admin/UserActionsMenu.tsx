
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserCog, Mail, Trash2 } from "lucide-react";
import { User } from "@/types/types";
import { useState } from "react";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { toast } from "sonner";
import { deleteUser, resendInvitation } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";

interface UserActionsMenuProps {
  user: User;
  onActionComplete: () => void;
}

export const UserActionsMenu = ({ user, onActionComplete }: UserActionsMenuProps) => {
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const handleResendInvite = async () => {
    try {
      setIsSendingInvite(true);
      
      const { success, error } = await resendInvitation(user.email);
      
      if (success) {
        toast.success(`Invitation renvoyée à ${user.email}`);
        onActionComplete();
      } else {
        toast.error(`Erreur: ${error || "Impossible de renvoyer l'invitation"}`);
      }
    } catch (error) {
      console.error("Erreur lors du renvoi de l'invitation:", error);
      toast.error("Impossible de renvoyer l'invitation");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);
      
      // Confirmation avant suppression
      if (!confirm(`Êtes-vous sûr de vouloir supprimer ${user.name} (${user.email}) ? Cette action est irréversible.`)) {
        setIsDeleting(false);
        return;
      }
      
      const { success, error } = await deleteUser(user.id);
      
      if (success) {
        toast.success(`L'utilisateur ${user.name} a été supprimé avec succès`);
        onActionComplete();
      } else {
        toast.error(`Erreur: ${error || "Une erreur est survenue lors de la suppression de l'utilisateur"}`);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      toast.error("Une erreur est survenue lors de la suppression de l'utilisateur");
    } finally {
      setIsDeleting(false);
    }
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
          <DropdownMenuItem onClick={() => setIsChangeRoleOpen(true)} disabled={isDeleting || isSendingInvite}>
            <UserCog className="mr-2 h-4 w-4" />
            <span>Changer de rôle</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResendInvite} disabled={isDeleting || isSendingInvite}>
            <Mail className="mr-2 h-4 w-4" />
            <span>{isSendingInvite ? "Envoi en cours..." : "Renvoyer l'invitation"}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDeleteUser} className="text-red-600" disabled={isDeleting || isSendingInvite}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{isDeleting ? "Suppression en cours..." : "Supprimer"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeRoleDialog 
        open={isChangeRoleOpen} 
        onOpenChange={setIsChangeRoleOpen} 
        user={user} 
        onRoleChanged={onActionComplete} 
      />
    </>
  );
};
