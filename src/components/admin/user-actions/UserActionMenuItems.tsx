
import { Edit, Mail, Trash2, Shield, LineChart, HeadsetIcon, Loader2 } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { User, UserRole } from "@/types/types";
import { toast } from "sonner";
import { updateUserRole } from "@/services/user/userManagement";
import { resendInvitation } from "@/services/user";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface UserActionMenuItemsProps {
  user: User;
  isSendingInvite: boolean;
  isDeleting: boolean;
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
  const queryClient = useQueryClient();
  const [isChangingRole, setIsChangingRole] = useState(false);
  
  const handleResendInvitation = async () => {
    if (isSendingInvite || isDeleting || isChangingRole) return;
    
    // Toast persistant qui sera mis à jour
    const toastId = toast.loading(`Envoi d'une invitation à ${user.email}...`);
    
    try {
      setIsSendingInvite(true);
      
      // Utilisation explicite de l'email
      const userEmail = user.email.trim();
      
      // Envoyer l'invitation
      const result = await resendInvitation(userEmail);
      
      if (result.success) {
        // Mise à jour du toast en succès
        toast.success("Invitation envoyée", {
          id: toastId,
          description: `Une invitation a été envoyée à ${userEmail}`
        });
        
        // Forcer le rafraîchissement des données
        queryClient.invalidateQueries({ 
          queryKey: ['users'],
          refetchType: 'all'
        });
        
        // Notifier le composant parent
        onActionComplete();
      } else {
        toast.error("Erreur lors de l'envoi", {
          id: toastId,
          description: result.error || "Une erreur est survenue"
        });
      }
    } catch (error) {
      console.error("Exception lors de l'envoi de l'invitation:", error);
      toast.error("Erreur système", {
        id: toastId
      });
    } finally {
      // Reset de l'état d'envoi
      setTimeout(() => {
        setIsSendingInvite(false);
      }, 300);
    }
  };
  
  // Fonction pour changer le rôle directement
  const handleDirectRoleChange = async (newRole: UserRole) => {
    if (newRole === user.role || isDeleting || isSendingInvite || isChangingRole) return;
    
    const toastId = toast.loading(`Modification du rôle pour ${user.email}...`);
    
    try {
      setIsChangingRole(true);
      
      const { success, error } = await updateUserRole(user.id, newRole);
      
      if (success) {
        // Mise à jour du toast en succès
        toast.success("Rôle modifié", {
          id: toastId,
          description: `Le rôle de ${user.email} a été modifié en ${newRole}`
        });
        
        // Rafraîchir les données et notifier
        queryClient.invalidateQueries({ 
          queryKey: ['users'],
          refetchType: 'all'
        });
        
        // Notifier le composant parent
        onActionComplete();
      } else {
        toast.error("Erreur", {
          id: toastId,
          description: error || "Une erreur est survenue"
        });
      }
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
      toast.error("Erreur", { id: toastId });
    } finally {
      // Reset de l'état
      setTimeout(() => {
        setIsChangingRole(false);
      }, 300);
    }
  };
  
  // Obtenir l'icône appropriée pour chaque rôle
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4 mr-2" />;
      case "growth": return <LineChart className="h-4 w-4 mr-2" />;
      case "sdr": return <HeadsetIcon className="h-4 w-4 mr-2" />;
      default: return <Edit className="h-4 w-4 mr-2" />;
    }
  };
  
  const isButtonDisabled = isSendingInvite || isDeleting || isChangingRole;
  
  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={isButtonDisabled} className="gap-2">
          <Edit className="h-4 w-4" />
          <span>Modifier le rôle</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {user.role !== "admin" && (
            <DropdownMenuItem 
              onClick={() => handleDirectRoleChange("admin")}
              disabled={isButtonDisabled}
            >
              {getRoleIcon("admin")}
              <span>Admin</span>
            </DropdownMenuItem>
          )}
          {user.role !== "growth" && (
            <DropdownMenuItem 
              onClick={() => handleDirectRoleChange("growth")}
              disabled={isButtonDisabled}
            >
              {getRoleIcon("growth")}
              <span>Growth</span>
            </DropdownMenuItem>
          )}
          {user.role !== "sdr" && (
            <DropdownMenuItem 
              onClick={() => handleDirectRoleChange("sdr")}
              disabled={isButtonDisabled}
            >
              {getRoleIcon("sdr")}
              <span>SDR</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      
      <DropdownMenuItem 
        onClick={handleResendInvitation} 
        disabled={isButtonDisabled}
        className="gap-2"
      >
        {isSendingInvite ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        <span>{isSendingInvite ? "Envoi en cours..." : "Renvoyer l'invitation"}</span>
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem 
        onClick={onDelete} 
        disabled={isButtonDisabled}
        className="text-destructive gap-2 focus:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        <span>Supprimer</span>
      </DropdownMenuItem>
    </>
  );
};
