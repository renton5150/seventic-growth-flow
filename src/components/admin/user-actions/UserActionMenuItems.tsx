
import { Edit, Mail, Trash2, Shield, LineChart, HeadsetIcon, Loader2 } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { User, UserRole } from "@/types/types";
import { toast } from "sonner";
import { updateUserRole } from "@/services/user/userManagement";
import { resendInvitation } from "@/services/user/userInvitation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface UserActionMenuItemsProps {
  user: User;
  onDelete: () => void;
  onActionComplete: () => void;
}

export const UserActionMenuItems = ({
  user,
  onDelete,
  onActionComplete
}: UserActionMenuItemsProps) => {
  const queryClient = useQueryClient();
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  
  const handleResendInvitation = async () => {
    if (isSendingInvite) return;
    
    const toastId = toast.loading(`Envoi d'une invitation à ${user.email}...`);
    
    try {
      setIsSendingInvite(true);
      console.log("Début du processus d'invitation pour:", user.email);
      
      // Utiliser la fonction resendInvitation améliorée
      const result = await resendInvitation(user.email);
      
      console.log("Résultat de resendInvitation:", result);
      
      if (result.success) {
        toast.success("Invitation envoyée", {
          id: toastId,
          description: `Un email d'invitation a été envoyé à ${user.email}`
        });
        
        setTimeout(() => onActionComplete(), 300);
      } else {
        toast.error("Erreur lors de l'envoi", {
          id: toastId,
          description: result.error || "Une erreur est survenue"
        });
        
        console.error("Échec de l'envoi de l'invitation:", result.error);
      }
    } catch (error) {
      console.error("Exception lors de l'envoi de l'invitation:", error);
      toast.error("Erreur système", {
        id: toastId,
        description: "Une erreur système est survenue lors de l'envoi"
      });
    } finally {
      setTimeout(() => setIsSendingInvite(false), 300);
    }
  };
  
  // Fonction pour changer directement le rôle
  const handleDirectRoleChange = async (newRole: UserRole) => {
    if (newRole === user.role || isChangingRole) return;
    
    const toastId = toast.loading(`Modification du rôle pour ${user.email}...`);
    
    try {
      setIsChangingRole(true);
      
      const { success, error } = await updateUserRole(user.id, newRole);
      
      if (success) {
        toast.success("Rôle modifié", {
          id: toastId,
          description: `Le rôle de ${user.email} a été modifié en ${newRole}`
        });
        
        setTimeout(() => onActionComplete(), 300);
      } else {
        toast.error("Erreur", {
          id: toastId,
          description: error || "Une erreur est survenue"
        });
      }
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
      toast.error("Erreur système", { 
        id: toastId,
        description: "Une erreur système est survenue lors de la modification du rôle"
      });
    } finally {
      setTimeout(() => setIsChangingRole(false), 300);
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
  
  const isButtonDisabled = isSendingInvite || isChangingRole;
  
  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={isButtonDisabled} className="gap-2 cursor-pointer">
          <Edit className="h-4 w-4" />
          <span>Modifier le rôle</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {user.role !== "admin" && (
            <DropdownMenuItem 
              onClick={() => handleDirectRoleChange("admin")}
              disabled={isButtonDisabled}
              className="cursor-pointer"
            >
              {getRoleIcon("admin")}
              <span>Admin</span>
            </DropdownMenuItem>
          )}
          {user.role !== "growth" && (
            <DropdownMenuItem 
              onClick={() => handleDirectRoleChange("growth")}
              disabled={isButtonDisabled}
              className="cursor-pointer"
            >
              {getRoleIcon("growth")}
              <span>Growth</span>
            </DropdownMenuItem>
          )}
          {user.role !== "sdr" && (
            <DropdownMenuItem 
              onClick={() => handleDirectRoleChange("sdr")}
              disabled={isButtonDisabled}
              className="cursor-pointer"
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
        className="gap-2 cursor-pointer"
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
        className="text-destructive gap-2 focus:text-destructive cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
        <span>Supprimer</span>
      </DropdownMenuItem>
    </>
  );
};
