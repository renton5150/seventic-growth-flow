
import { MoreHorizontal, Edit, Trash2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types/types";
import { toast } from "sonner";
import { resetUserPassword } from "@/services/invitation/invitationService";
import { resendInvitation } from "@/services/user/userInvitation";

interface UserActionMenuItemsProps {
  user: User;
  onChangeRole: (user: User) => void;
  onDelete: (user: User) => void;
  onRefresh?: () => void;
}

export const UserActionMenuItems = ({ 
  user, 
  onChangeRole, 
  onDelete, 
  onRefresh 
}: UserActionMenuItemsProps) => {
  
  const handleResetPassword = async () => {
    try {
      console.log("🔄 Réinitialisation mot de passe pour:", user.email);
      const result = await resetUserPassword(user.email);
      
      if (result.success) {
        toast.success("Lien de réinitialisation envoyé par email");
      } else {
        toast.error(result.error || "Erreur lors de l'envoi du lien");
      }
    } catch (error) {
      console.error("Erreur réinitialisation:", error);
      toast.error("Erreur lors de la réinitialisation");
    }
  };

  const handleResendInvitation = async () => {
    try {
      console.log("🔄 Renvoi invitation pour:", user.email);
      const result = await resendInvitation(user.email);
      
      if (result.success) {
        const message = result.userExists 
          ? "Lien de réinitialisation renvoyé"
          : "Invitation renvoyée par email";
        toast.success(message);
      } else {
        toast.error(result.error || "Erreur lors du renvoi");
      }
    } catch (error) {
      console.error("Erreur renvoi invitation:", error);
      toast.error("Erreur lors du renvoi de l'invitation");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onChangeRole(user)}>
          <Edit className="mr-2 h-4 w-4" />
          Modifier le rôle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleResetPassword}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Réinitialiser mot de passe
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleResendInvitation}>
          <Mail className="mr-2 h-4 w-4" />
          Renvoyer invitation
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onDelete(user)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
