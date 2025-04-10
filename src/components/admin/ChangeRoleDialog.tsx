
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
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Reset selected role when dialog opens with a different user
  useEffect(() => {
    if (open) {
      setSelectedRole(user.role);
    }
  }, [open, user.role]);

  const handleSave = async () => {
    try {
      // Désactiver le bouton pendant le traitement
      setIsProcessing(true);
      
      // 1. Fermer d'abord la boîte de dialogue (pour éviter le freeze)
      onOpenChange(false);
      
      // 2. Afficher une notification de chargement
      const loadingToastId = toast.loading(`Modification du rôle de ${user.email}...`);
      
      // 3. Appeler l'API avec un léger délai (pour donner le temps au dialogue de se fermer)
      setTimeout(async () => {
        try {
          console.log(`Changement de rôle : ${user.email} de ${user.role} à ${selectedRole}`);
          
          // Appel à l'API pour changer le rôle
          const result = await updateUserRole(user.id, selectedRole);
          
          if (result.success) {
            // 4. Notification de succès (en remplaçant la notification de chargement)
            toast.success("Rôle modifié", {
              id: loadingToastId,
              description: `Le rôle de ${user.email} a été modifié avec succès.`
            });
            
            // 5. Appeler la fonction de rappel pour rafraîchir la liste des utilisateurs
            onRoleChanged();
          } else {
            // Afficher l'erreur (en remplaçant la notification de chargement)
            toast.error("Erreur", {
              id: loadingToastId,
              description: result.error || "Une erreur est survenue lors du changement de rôle."
            });
          }
        } catch (error) {
          console.error("Erreur lors du changement de rôle:", error);
          toast.error("Erreur", {
            id: loadingToastId,
            description: "Une erreur est survenue lors du changement de rôle."
          });
        } finally {
          // Réactiver le bouton après le traitement
          setIsProcessing(false);
        }
      }, 300); // délai de 300ms pour laisser le temps à l'UI de se rafraîchir
    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast.error("Erreur", {
        description: "Une erreur inattendue est survenue."
      });
      setIsProcessing(false);
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
            disabled={selectedRole === user.role || isProcessing}
            className="min-w-[100px]"
          >
            {isProcessing ? "Traitement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
