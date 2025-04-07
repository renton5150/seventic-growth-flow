
import { Loader2, Mail, Trash2, UserCog } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { User } from "@/types/types";
import { toast } from "sonner";
import { resendInvitation } from "@/services/user";

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
  
  const handleResendInvite = async () => {
    if (isSendingInvite) return;
    
    try {
      setIsSendingInvite(true);
      
      // Afficher un toast de chargement persistant
      const toastId = toast.loading(`Envoi de l'invitation à ${user.email}...`);
      
      const { success, error, warning } = await resendInvitation(user.email);
      
      // Fermer le toast de chargement
      toast.dismiss(toastId);
      
      if (success) {
        if (warning) {
          toast.warning(warning, {
            description: "L'invitation a peut-être été envoyée. Vérifiez la boîte de réception du destinataire ou les logs Supabase.",
            duration: 8000
          });
        } else {
          toast.success(`Invitation renvoyée à ${user.email}`, {
            description: "L'utilisateur devrait recevoir un email sous peu."
          });
        }
        onActionComplete();
      } else {
        toast.error(`Erreur: ${error || "Impossible de renvoyer l'invitation"}`, {
          description: "Vérifiez la configuration SMTP dans Supabase et les logs de la fonction Edge.",
          duration: 8000,
          action: {
            label: 'Consulter les logs',
            onClick: () => window.open('https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs', '_blank')
          }
        });
      }
    } catch (error) {
      console.error("Erreur lors du renvoi de l'invitation:", error);
      toast.error("Impossible de renvoyer l'invitation", {
        description: "Une erreur inattendue s'est produite. Consultez la console pour plus de détails."
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  return (
    <>
      <DropdownMenuItem onClick={onChangeRole} disabled={isDeleting || isSendingInvite}>
        <UserCog className="mr-2 h-4 w-4" />
        <span>Changer de rôle</span>
      </DropdownMenuItem>
      
      <DropdownMenuItem onClick={handleResendInvite} disabled={isDeleting || isSendingInvite}>
        {isSendingInvite ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        <span>{isSendingInvite ? "Envoi en cours..." : "Renvoyer l'invitation"}</span>
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem onClick={onDelete} className="text-red-600" disabled={isDeleting || isSendingInvite}>
        {isDeleting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="mr-2 h-4 w-4" />
        )}
        <span>Supprimer</span>
      </DropdownMenuItem>
    </>
  );
};
