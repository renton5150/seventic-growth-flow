
import { Edit, Mail, Trash2, Shield, LineChart, HeadsetIcon, Loader2 } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { User, UserRole } from "@/types/types";
import { toast } from "sonner";
import { updateUserRole } from "@/services/user/userManagement";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    
    // Toast persistant qui sera mis à jour
    const toastId = toast.loading(`Envoi d'une invitation à ${user.email}...`);
    
    try {
      setIsSendingInvite(true);
      console.log("Début du processus de réinitialisation pour:", user.email);
      
      // Créer une URL de redirection claire avec tous les paramètres nécessaires
      const origin = window.location.origin;
      const redirectUrl = `${origin}/reset-password?type=invite&email=${encodeURIComponent(user.email)}`;
      
      console.log("URL de redirection pour réinitialisation:", redirectUrl);
      
      // Utiliser la méthode resetPasswordForEmail avec une durée de validité plus longue
      const { data, error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: redirectUrl,
      });
      
      console.log("Résultat de resetPasswordForEmail:", { data, error });
      
      if (error) {
        toast.error("Erreur lors de l'envoi", {
          id: toastId,
          description: error.message || "Une erreur est survenue"
        });
        
        console.error("Échec de l'envoi de l'email de réinitialisation:", {
          email: user.email,
          error: error
        });
      } else {
        // Mise à jour du toast en succès
        toast.success("Invitation envoyée", {
          id: toastId,
          description: `Un email de réinitialisation a été envoyé à ${user.email}`
        });
        
        // Détails en console pour le débogage
        console.log("Email de réinitialisation envoyé avec succès à:", user.email);
        
        // Attendre avant de notifier le parent
        setTimeout(() => onActionComplete(), 300);
      }
    } catch (error) {
      console.error("Exception lors de l'envoi de l'email de réinitialisation:", error);
      toast.error("Erreur système", {
        id: toastId,
        description: "Une erreur système est survenue lors de l'envoi"
      });
    } finally {
      // Réinitialiser l'état d'envoi après un court délai
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
        // Mise à jour du toast en succès
        toast.success("Rôle modifié", {
          id: toastId,
          description: `Le rôle de ${user.email} a été modifié en ${newRole}`
        });
        
        // Attendre avant de notifier le parent
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
      // Réinitialiser l'état après un court délai
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
