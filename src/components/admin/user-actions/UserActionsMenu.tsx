
import { useState, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { User } from "@/types/types";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UserActionMenuItems } from "./UserActionMenuItems";
import { useQueryClient } from "@tanstack/react-query";

interface UserActionsMenuProps {
  user: User;
  onActionComplete: () => void;
}

export const UserActionsMenu = ({ user, onActionComplete }: UserActionsMenuProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const queryClient = useQueryClient();

  // Nettoyer l'état lors du démontage pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      if (isDeleting || isSendingInvite) {
        console.log("Composant UserActionsMenu démonté pendant une opération, nettoyage de l'état");
        // Nettoyage sécurisé asynchrone
        setTimeout(() => {
          setIsDeleting(false);
          setIsSendingInvite(false);
        }, 100);
      }
    };
  }, [isDeleting, isSendingInvite]);

  const handleActionComplete = () => {
    // Fermer le dropdown après une action
    setIsDropdownOpen(false);
    
    // Invalider les requêtes pertinentes pour garantir que les données sont à jour
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      // Notifier le composant parent
      setTimeout(() => {
        onActionComplete();
      }, 200);
    }, 300);
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={isDeleting || isSendingInvite}
            aria-label="Menu d'actions pour l'utilisateur"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Menu d'actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <UserActionMenuItems 
            user={user}
            isSendingInvite={isSendingInvite}
            isDeleting={isDeleting}
            onChangeRole={() => {}} // Fonction vide car nous n'ouvrons plus de dialogue
            onDelete={() => {
              setIsDropdownOpen(false); // Fermer d'abord le dropdown
              setTimeout(() => setIsDeleteDialogOpen(true), 100); // Puis ouvrir la boîte de dialogue avec un léger délai
            }}
            setIsSendingInvite={setIsSendingInvite}
            onActionComplete={handleActionComplete}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={user}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        onUserDeleted={handleActionComplete}
      />
    </>
  );
};
