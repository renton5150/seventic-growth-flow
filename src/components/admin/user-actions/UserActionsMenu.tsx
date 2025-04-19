
import { useState, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { User } from "@/types/types";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UserActionMenuItems } from "./UserActionMenuItems";

interface UserActionsMenuProps {
  user: User;
  onActionComplete: () => void;
}

export const UserActionsMenu = ({ user, onActionComplete }: UserActionsMenuProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Nettoyer l'état lors du démontage pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      setIsDeleting(false);
      setIsSendingInvite(false);
      setIsDropdownOpen(false);
    };
  }, []);

  const handleActionComplete = () => {
    // Fermer le dropdown immédiatement
    setIsDropdownOpen(false);
    
    // Notifier le composant parent sans délai
    onActionComplete();
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={(open) => {
        if (!isDeleting && !isSendingInvite) {
          setIsDropdownOpen(open);
        }
      }}>
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
        {isDropdownOpen && (
          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => {
            // Empêcher les problèmes de focus qui peuvent causer des gelures d'UI
            e.preventDefault();
          }}>
            <UserActionMenuItems 
              user={user}
              isSendingInvite={isSendingInvite}
              isDeleting={isDeleting}
              onDelete={() => {
                setIsDropdownOpen(false); // Fermer d'abord le dropdown
                setTimeout(() => setIsDeleteDialogOpen(true), 50);
              }}
              setIsSendingInvite={setIsSendingInvite}
              onActionComplete={handleActionComplete}
            />
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={user}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        onUserDeleted={onActionComplete}
      />
    </>
  );
};
