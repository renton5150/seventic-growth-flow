
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/types/types";
import { createUser } from "@/services/userService";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole: UserRole;
  onUserInvited: () => void;
}

export const InviteUserDialog = ({ open, onOpenChange, defaultRole, onUserInvited }: InviteUserDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole(defaultRole);
    setErrorMessage(null);
  };

  const handleInvite = async () => {
    if (!name || !email) {
      setErrorMessage("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log("Envoi de l'invitation avec le rôle:", role);
      const result = await createUser(email, name, role);
      
      if (result.success) {
        toast.success("Invitation envoyée", {
          description: `Une invitation a été envoyée à ${email}`
        });
        
        // Réinitialiser les champs et fermer le dialogue
        resetForm();
        onUserInvited();
        onOpenChange(false);
      } else {
        setErrorMessage(result.error || "Une erreur est survenue lors de l'envoi de l'invitation");
      }
    } catch (error) {
      console.error("Erreur lors de l'invitation:", error);
      setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isLoading) {
        onOpenChange(isOpen);
        if (!isOpen) {
          resetForm();
        } else {
          setRole(defaultRole);
        }
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un utilisateur</DialogTitle>
          <DialogDescription>
            Envoyer une invitation par email pour rejoindre l'application
          </DialogDescription>
        </DialogHeader>
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez le nom complet"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entrez l'adresse email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select 
              value={role} 
              onValueChange={(value: string) => setRole(value as UserRole)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleInvite} disabled={isLoading}>
            {isLoading ? "Envoi en cours..." : "Envoyer l'invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
