
import { Edit, Mail, Trash2, User as UserIcon, Shield, LineChart, HeadsetIcon, Loader2 } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { User } from "@/types/types";
import { toast } from "sonner";
import { updateUserRole } from "@/services/user/userManagement";
import { resendInvitation } from "@/services/user";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
  const queryClient = useQueryClient();
  const [localSending, setLocalSending] = useState(false);
  
  const handleResendInvitation = async () => {
    if (isSendingInvite || localSending) return;
    
    // Create a persistent toast that will be updated with results
    const toastId = toast.loading(`Envoi d'une invitation à ${user.email}...`, {
      duration: 10000 // Longer duration to ensure visibility
    });
    
    try {
      setIsSendingInvite(true);
      setLocalSending(true);
      
      console.log("Envoi d'invitation explicitement à l'email:", user.email);
      
      // Using explicit email string for clarity
      const userEmail = user.email.trim();
      console.log("Email après trim:", userEmail);
      
      // Send the invitation with extended expiration
      const result = await resendInvitation(userEmail);
      
      console.log("Résultat du renvoi d'invitation:", JSON.stringify(result, null, 2));
      
      if (result.success) {
        // Close any open menus first (done by parent component)
        
        // Update toast to success and show for a bit longer
        toast.success("Invitation envoyée", {
          id: toastId,
          description: `Une invitation a été envoyée à ${userEmail}`,
          duration: 5000
        });
        
        // Allow some time to show success message before refreshing
        setTimeout(() => {
          // Force refresh of user data with aggressive invalidation
          queryClient.invalidateQueries({ 
            queryKey: ['users'],
            refetchType: 'all'
          });
          queryClient.invalidateQueries({ 
            queryKey: ['admin-users'],
            refetchType: 'all'
          });
          
          // Notify parent after a short delay
          setTimeout(() => {
            onActionComplete();
          }, 300);
        }, 500);
      } else {
        toast.error("Erreur lors de l'envoi", {
          id: toastId,
          description: result.error || "Une erreur est survenue lors de l'envoi de l'invitation",
          duration: 8000
        });
      }
    } catch (error) {
      console.error("Exception lors de l'envoi de l'invitation:", error);
      toast.error("Erreur système", {
        id: toastId, 
        description: "Une erreur système est survenue lors de l'envoi de l'invitation",
        duration: 8000
      });
    } finally {
      // Reset sending state after a short delay to prevent rapid re-clicks
      setTimeout(() => {
        setIsSendingInvite(false);
        setLocalSending(false);
      }, 800);
    }
  };
  
  // Fonction pour changer directement le rôle sans boîte de dialogue
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
        
        // Force refresh of data
        setTimeout(() => {
          queryClient.invalidateQueries({ 
            queryKey: ['users'],
            refetchType: 'all'
          });
          queryClient.invalidateQueries({ 
            queryKey: ['admin-users'],
            refetchType: 'all'
          });
          
          // Notify parent
          setTimeout(() => {
            onActionComplete();
          }, 300);
        }, 300);
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
      default: return <UserIcon className="h-4 w-4 mr-2" />;
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
        disabled={isSendingInvite || localSending}
        className="gap-2"
      >
        {(isSendingInvite || localSending) ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        <span>{(isSendingInvite || localSending) ? "Envoi en cours..." : "Renvoyer l'invitation"}</span>
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
