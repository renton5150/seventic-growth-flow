
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
  
  // Timeout control
  const [actionTimeout, setActionTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleResendInvite = async () => {
    try {
      setIsSendingInvite(true);
      
      // Set a more aggressive timeout (10s instead of 15s)
      const timeout = setTimeout(() => {
        toast.error("L'opération prend plus de temps que prévu. Veuillez rafraîchir la page pour vérifier si l'invitation a été envoyée.");
        setIsSendingInvite(false);
      }, 10000);
      
      setActionTimeout(timeout);
      
      const { success, error } = await resendInvitation(user.email);
      
      if (actionTimeout) clearTimeout(actionTimeout);
      
      if (success) {
        toast.success(`Invitation renvoyée à ${user.email}`);
        onActionComplete();
      } else {
        toast.error(`Erreur: ${error || "Impossible de renvoyer l'invitation"}`);
      }
    } catch (error) {
      console.error("Erreur lors du renvoi de l'invitation:", error);
      toast.error("Impossible de renvoyer l'invitation");
    } finally {
      if (actionTimeout) clearTimeout(actionTimeout);
      setIsSendingInvite(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);
      
      // Set a more aggressive timeout (10s instead of 15s)
      const timeout = setTimeout(() => {
        toast.error("La suppression prend plus de temps que prévu. Veuillez rafraîchir la page pour vérifier si l'utilisateur a été supprimé.");
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
      }, 10000);
      
      setActionTimeout(timeout);
      
      const { success, error } = await deleteUser(user.id);
      
      if (actionTimeout) clearTimeout(actionTimeout);
      
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
      if (actionTimeout) clearTimeout(actionTimeout);
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
