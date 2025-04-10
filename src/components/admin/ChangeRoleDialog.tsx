
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User, UserRole } from "@/types/types";
import { toast } from "sonner";
import { updateUserRole } from "@/services/user/userManagement";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onRoleChanged: () => void;
}

export const ChangeRoleDialog = ({
  open,
  onOpenChange,
  user,
  onRoleChanged,
}: ChangeRoleDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Reset selected role when dialog opens with a different user
  useEffect(() => {
    if (open) {
      setSelectedRole(user.role);
    }
  }, [open, user.role]);

  const handleSave = async () => {
    // Skip update if role hasn't changed
    if (selectedRole === user.role) {
      onOpenChange(false);
      return;
    }

    // IMPORTANT: Fermer le dialogue IMMÉDIATEMENT pour libérer l'interface
    onOpenChange(false);
    
    // Afficher un toast de chargement global
    const toastId = toast.loading(`Mise à jour du rôle de ${user.name}...`);
    
    try {
      console.log(`Updating role for user ${user.id} from ${user.role} to ${selectedRole}`);
      
      const { success, error } = await updateUserRole(user.id, selectedRole);

      if (!success) {
        throw new Error(error);
      }
      
      console.log("Role updated successfully");
      
      // Remplacer le toast de chargement par un toast de succès
      toast.success("Rôle mis à jour", {
        id: toastId,
        description: `Le rôle de ${user.name} a été changé en ${selectedRole}`
      });
      
      // Invalider les requêtes pour garantir des données à jour
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      // Notifier le parent avec un court délai pour laisser le temps aux animations de se terminer
      setTimeout(() => {
        onRoleChanged();
      }, 50);
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rôle:", error);
      // Gestion d'erreur avec le même ID de toast
      toast.error("Erreur", {
        id: toastId,
        description: "Une erreur est survenue lors du changement de rôle"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le rôle</DialogTitle>
          <DialogDescription>
            Modifier le rôle de {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Sélectionnez un rôle</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="sdr">SDR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={selectedRole === user.role}
            className="min-w-[100px]"
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
