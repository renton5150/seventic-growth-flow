
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserCog, Mail, Trash2, Loader2, ExternalLink } from "lucide-react";
import { User } from "@/types/types";
import { useState } from "react";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { toast } from "sonner";
import { deleteUser, resendInvitation } from "@/services/user";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UserActionsMenuProps {
  user: User;
  onActionComplete: () => void;
}

export const UserActionsMenu = ({ user, onActionComplete }: UserActionsMenuProps) => {
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleResendInvite = async () => {
    if (isSendingInvite) return;
    
    try {
      setIsSendingInvite(true);
      
      // Afficher un toast de chargement persistant
      const toastId = toast.loading(`Envoi de l'invitation à ${user.email}...`, {
        description: "Cela peut prendre jusqu'à 30 secondes, veuillez patienter."
      });
      
      const { success, error, warning, details } = await resendInvitation(user.email);
      
      // Fermer le toast de chargement
      toast.dismiss(toastId);
      
      if (success) {
        toast.success(`Email envoyé à ${user.email}`, {
          description: "Un email avec un lien d'invitation ou de réinitialisation a été envoyé. Vérifiez également dans les spams/indésirables.",
          duration: 8000,
          action: {
            label: "Logs",
            onClick: () => {
              window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs", "_blank");
            },
          },
        });
        onActionComplete();
      } else if (warning) {
        // Afficher un toast d'avertissement si l'opération a pris du temps mais peut avoir réussi
        toast.warning(warning, {
          description: "Vérifiez votre boîte de réception et vos spams, l'email a peut-être bien été envoyé.",
          duration: 8000,
          action: {
            label: "Logs",
            onClick: () => {
              window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs", "_blank");
            },
          },
        });
      } else {
        // Afficher des informations de débogage dans la console
        console.error("Erreur détaillée du renvoi d'invitation:", details || error);
        
        // Message pour cas spécifique d'utilisateur déjà enregistré
        if (error?.includes("déjà enregistré") || error?.includes("already been registered")) {
          toast.info(`${user.name} a déjà un compte`, {
            description: "Un email de réinitialisation de mot de passe a été envoyé à la place d'une invitation.",
            duration: 8000,
            action: {
              label: "Logs",
              onClick: () => {
                window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs", "_blank");
              },
            },
          });
          onActionComplete();
          return;
        }
        
        // Message générique complet avec plus de détails
        toast.error(`Erreur d'envoi`, {
          description: `${error || "Une erreur est survenue lors de l'envoi de l'email."}`,
          duration: 8000,
          action: {
            label: "Logs",
            onClick: () => {
              window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs", "_blank");
            },
          },
        });
        
        // Toast d'aide supplémentaire avec lien vers la config SMTP
        setTimeout(() => {
          toast.info("Vérifiez la configuration SMTP", {
            description: "Assurez-vous que vos paramètres SMTP sont corrects et que votre serveur d'email fonctionne.",
            duration: 10000,
            action: {
              label: "Config SMTP",
              onClick: () => {
                window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/auth/smtp", "_blank");
              },
            },
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Exception lors du renvoi de l'invitation:", error);
      toast.error("Erreur de communication", {
        description: "Impossible de contacter la fonction Edge. Vérifiez votre connexion internet ou les logs pour plus de détails."
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);
      toast.loading(`Suppression de l'utilisateur ${user.name}...`);
      
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
      setIsDeleteDialogOpen(false);
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
            {isSendingInvite ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            <span>{isSendingInvite ? "Envoi en cours..." : "Renvoyer l'invitation"}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/auth/smtp", "_blank")}
            className="text-blue-600"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Config SMTP</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs", "_blank")}
            className="text-blue-600"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Logs d'invitation</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600" disabled={isDeleting || isSendingInvite}>
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            <span>Supprimer</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeRoleDialog 
        open={isChangeRoleOpen} 
        onOpenChange={setIsChangeRoleOpen} 
        user={user} 
        onRoleChanged={onActionComplete} 
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur {user.name} ({user.email}) ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Suppression en cours...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

