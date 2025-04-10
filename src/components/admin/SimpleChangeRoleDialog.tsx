
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, UserRole } from "@/types/types";
import { toast } from "sonner";
import { updateUserRole } from "@/services/user/userManagement";

interface SimpleChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onRoleChanged: () => void;
}

export const SimpleChangeRoleDialog = ({
  open,
  onOpenChange,
  user,
  onRoleChanged,
}: SimpleChangeRoleDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Reset selected role when dialog opens with a different user
  useEffect(() => {
    if (open) {
      setSelectedRole(user.role);
    }
  }, [open, user.role]);

  const handleSave = () => {
    try {
      // Désactiver le bouton et fermer d'abord la boîte de dialogue
      setIsProcessing(true);
      onOpenChange(false);
      
      // Afficher une notification de chargement
      const loadingToastId = toast.loading(`Modification du rôle de ${user.email}...`);
      
      // Délai pour permettre à l'UI de se rafraîchir avant d'exécuter l'opération 
      setTimeout(async () => {
        try {
          console.log(`Changement de rôle : ${user.email} de ${user.role} à ${selectedRole}`);
          
          // Appel API pour mettre à jour le rôle
          const result = await updateUserRole(user.id, selectedRole);
          
          if (result.success) {
            // Notification de succès
            toast.success("Rôle modifié", {
              id: loadingToastId,
              description: `Le rôle de ${user.email} a été modifié avec succès.`
            });
            
            // Rafraîchir la liste des utilisateurs via callback
            onRoleChanged();
          } else {
            // Notification d'erreur
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
          setIsProcessing(false);
        }
      }, 300);
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
      <DialogContent className="p-6">
        <DialogHeader className="mb-4">
          <DialogTitle>Changer le rôle</DialogTitle>
          <DialogDescription>
            Modifier le rôle de {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)} className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="admin" id="admin" />
              <Label htmlFor="admin">Admin</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="growth" id="growth" />
              <Label htmlFor="growth">Growth</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sdr" id="sdr" />
              <Label htmlFor="sdr">SDR</Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="mt-4 space-x-2">
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
