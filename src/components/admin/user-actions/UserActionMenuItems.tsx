
import { Edit, Mail, Trash2, User, Shield, LineChart, HeadsetIcon } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { User } from "@/types/types";
import { toast } from "sonner";
import { resendInvitation, updateUserRole } from "@/services/user/userManagement";

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
  
  // Nouvelle fonction pour changer directement le rôle sans boîte de dialogue
  const handleDirectRoleChange = async (newRole: string) => {
    if (newRole === user.role) return;
    
    const toastId = toast.loading(`Modification du rôle pour ${user.email}...`);
    
    try {
      const { success, error } = await updateUserRole(user.id, newRole);
      
      if (success) {
        toast.success("Rôle modifié", {
          id: toastId,
          description: `Le rôle de ${user.email} a été modifié en ${newRole}`
        });
        
        // Délai pour permettre à l'UI de se mettre à jour
        setTimeout(() => {
          onActionComplete();
        }, 100);
      } else {
        toast.error("Erreur", {
          id: toastId,
          description: error || "Une erreur est survenue lors du changement de rôle"
        });
      }
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
      toast.error("Erreur", {
        id: toastId,
        description: "Une erreur est survenue lors du changement de rôle"
      });
    }
  };
  
  // Fonction pour obtenir l'icône appropriée pour chaque rôle
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4 mr-2" />;
      case "growth": return <LineChart className="h-4 w-4 mr-2" />;
      case "sdr": return <HeadsetIcon className="h-4 w-4 mr-2" />;
      default: return <User className="h-4 w-4 mr-2" />;
    }
  };
  
  return (
    <>
      {/* Remplacer le bouton "Modifier le rôle" par un sous-menu */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="gap-2">
          <Edit className="h-4 w-4" />
          <span>Modifier le rôle</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {user.role !== "admin" && (
            <DropdownMenuItem onClick={() => handleDirectRoleChange("admin")}>
              {getRoleIcon("admin")}
              <span>Admin</span>
            </DropdownMenuItem>
          )}
          {user.role !== "growth" && (
            <DropdownMenuItem onClick={() => handleDirectRoleChange("growth")}>
              {getRoleIcon("growth")}
              <span>Growth</span>
            </DropdownMenuItem>
          )}
          {user.role !== "sdr" && (
            <DropdownMenuItem onClick={() => handleDirectRoleChange("sdr")}>
              {getRoleIcon("sdr")}
              <span>SDR</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      
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
