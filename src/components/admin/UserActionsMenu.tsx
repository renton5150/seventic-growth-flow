
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserCog, Mail, Trash2, Loader2 } from "lucide-react";
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
      const toastId = toast.loading(`Envoi de l'invitation à ${user.email}...`);
      
      // Utiliser l'email de l'utilisateur au lieu de l'ID
      const { success, error, warning } = await resendInvitation(user.email);
      
      // Fermer le toast de chargement
      toast.dismiss(toastId);
      
      if (success) {
        if (warning) {
          toast.success(`Invitation probablement envoyée à ${user.email}`, {
            description: warning
          });
        } else {
          toast.success(`Invitation renvoyée à ${user.email}`);
        }
        onActionComplete();
      } else {
        toast.error(`Erreur: ${error || "Impossible de renvoyer l'invitation"}`);
      }
    } catch (error) {
      console.error("Erreur lors du renvoi de l'invitation:", error);
      toast.error("Impossible de renvoyer l'invitation");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);
      const toastId = toast.loading(`Suppression de l'utilisateur ${user.name}...`);
      
      const { success, error, warning } = await deleteUser(user.id);
      
      toast.dismiss(toastId);
      
      if (success) {
        if (warning) {
          toast.success(`Suppression de ${user.name} initiée`, {
            description: warning
          });
        } else {
          toast.success(`L'utilisateur ${user.name} a été supprimé avec succès`);
        }
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
