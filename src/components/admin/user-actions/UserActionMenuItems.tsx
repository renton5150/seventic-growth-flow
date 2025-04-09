
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
      
      console.log("Envoi d'une invitation à:", user.email);
      const { success, error, warning, userExists, actionUrl, emailProvider, smtpConfigured } = await resendInvitation(user.email);
      console.log("Résultat de l'envoi d'invitation:", { success, error, warning, userExists, actionUrl, emailProvider, smtpConfigured });
      
      // Fermer le toast de chargement
      toast.dismiss(toastId);
      
      if (success) {
        // Message clair sur le service d'email utilisé
        const emailServiceMsg = smtpConfigured 
          ? `Email envoyé via votre serveur SMTP personnalisé` 
          : `Email envoyé via le service email intégré de Supabase`;
        
        if (warning) {
          toast.warning(`Opération longue`, {
            description: "L'invitation a peut-être été envoyée. Vérifiez la boîte de réception du destinataire.",
            duration: 8000
          });
        } else if (userExists) {
          toast.success(`Email de réinitialisation envoyé à ${user.email}`, {
            description: `${emailServiceMsg}. L'utilisateur devrait recevoir un email pour réinitialiser son mot de passe.`,
            duration: 5000
          });
          
          if (actionUrl) {
            console.log("URL d'action générée:", actionUrl);
            // Option pour copier le lien
            toast.message("Lien de réinitialisation généré", {
              description: "Vous pouvez copier ce lien et l'envoyer manuellement si nécessaire.",
              action: {
                label: "Copier",
                onClick: () => {
                  navigator.clipboard.writeText(actionUrl);
                  toast.success("Lien copié !");
                }
              },
              duration: 10000
            });
          }
        } else {
          toast.success(`Invitation envoyée à ${user.email}`, {
            description: `${emailServiceMsg}. L'utilisateur devrait recevoir un email sous peu pour configurer son compte.`,
            duration: 5000
          });
          
          if (actionUrl) {
            console.log("URL d'invitation générée:", actionUrl);
            // Option pour copier le lien
            toast.message("Lien d'invitation généré", {
              description: "Vous pouvez copier ce lien et l'envoyer manuellement si nécessaire.",
              action: {
                label: "Copier",
                onClick: () => {
                  navigator.clipboard.writeText(actionUrl);
                  toast.success("Lien copié !");
                }
              },
              duration: 10000
            });
          }
        }
        onActionComplete();
      } else {
        toast.error(`Erreur: ${error || "Impossible d'envoyer l'email"}`, {
          description: "Vérifiez les logs de la fonction Edge pour plus de détails.",
          duration: 8000
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      toast.error("Impossible d'envoyer l'email", {
        description: "Une erreur inattendue s'est produite. Consultez la console pour plus de détails.",
        duration: 8000
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
