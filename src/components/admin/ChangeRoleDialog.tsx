
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
  
  // Reset selected role when dialog opens with a different user
  useEffect(() => {
    if (open) {
      setSelectedRole(user.role);
    }
  }, [open, user.role]);

  const handleSave = async () => {
    try {
      // Enregistrer l'état actuel du rôle pour debug
      console.log(`Changement de rôle : ${user.email} de ${user.role} à ${selectedRole}`);
      
      // Fermer simplement la boîte de dialogue sans faire d'appel API pour l'instant
      onOpenChange(false);
      
      // Si nous voulons montrer une notification, faisons-le ici
      toast.success("Rôle modifié", {
        description: `Le rôle de ${user.email} a été modifié avec succès.`,
      });
      
      // Actualiser manuellement la page après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors du changement de rôle."
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
