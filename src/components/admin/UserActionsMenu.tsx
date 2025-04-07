
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserCog, Mail, Trash2 } from "lucide-react";
import { User } from "@/types/types";
import { useState } from "react";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserActionsMenuProps {
  user: User;
  onActionComplete: () => void;
}

export const UserActionsMenu = ({ user, onActionComplete }: UserActionsMenuProps) => {
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const { toast } = useToast();

  const handleResendInvite = async () => {
    try {
      // Dans un vrai projet, nous aurions une fonction pour renvoyer l'invitation
      toast({
        title: "Invitation renvoyée",
        description: `Une nouvelle invitation a été envoyée à ${user.email}`,
      });
    } catch (error) {
      console.error("Erreur lors du renvoi de l'invitation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de renvoyer l'invitation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      // Suppression du profil utilisateur
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Utilisateur supprimé",
        description: `${user.name} a été supprimé avec succès`,
      });
      
      onActionComplete();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'utilisateur",
        variant: "destructive",
      });
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
          <DropdownMenuItem onClick={() => setIsChangeRoleOpen(true)}>
            <UserCog className="mr-2 h-4 w-4" />
            <span>Changer de rôle</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResendInvite}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Renvoyer l'invitation</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDeleteUser} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
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
    </>
  );
};
