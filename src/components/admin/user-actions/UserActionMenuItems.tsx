
import { Edit, Mail, Trash2 } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { User } from "@/types/types";
import { toast } from "sonner";
import { resendInvitation } from "@/services/user/userManagement";

interface UserActionMenuItemsProps {
  user: User;
  isSendingInvite: boolean;
  isDeleting: boolean;
  onChangeRole: () => void;
  onDelete: () => void;
  setIsSendingInvite: (value: boolean) => void;
  onActionComplete: () => void;
}

export const UserActionMenuItems = ({
  user,
  isSendingInvite,
  isDeleting,
  onChangeRole,
  onDelete,
  setIsSendingInvite,
  onActionComplete
}: UserActionMenuItemsProps) => {
  
  const handleResendInvitation = async () => {
    if (isSendingInvite) return;
    
    setIsSendingInvite(true);
    const toastId = toast.loading(`Envoi d'une invitation à ${user.email}...`);
    
    try {
      await resendInvitation(user.id);
      
      toast.success("Invitation envoyée", {
        id: toastId,
        description: `Une nouvelle invitation a été envoyée à ${user.email}`
      });
      
      onActionComplete();
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'invitation:", error);
      toast.error("Erreur", {
        id: toastId, 
        description: "Une erreur est survenue lors de l'envoi de l'invitation"
      });
    } finally {
      setIsSendingInvite(false);
    }
  };
  
  return (
    <>
      <DropdownMenuItem onClick={onChangeRole} className="gap-2">
        <Edit className="h-4 w-4" />
        <span>Modifier le rôle</span>
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        onClick={handleResendInvitation} 
        disabled={isSendingInvite}
        className="gap-2"
      >
        <Mail className="h-4 w-4" />
        <span>Renvoyer l'invitation</span>
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem 
        onClick={onDelete} 
        disabled={isDeleting}
        className="text-destructive gap-2 focus:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        <span>Supprimer</span>
      </DropdownMenuItem>
    </>
  );
};
