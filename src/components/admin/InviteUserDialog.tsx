
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
import { AlertCircle, Loader2 } from "lucide-react";

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
      console.log(`Envoi de l'invitation pour ${email} avec le rôle ${role}`);
      
      const result = await createUser(email, name, role);
      
      if (result.success) {
        toast.success("Utilisateur ajouté avec succès", {
          description: `${name} (${email}) a été ajouté en tant que ${role}`
        });
        
        console.log("Utilisateur créé:", result.user);
        
        // Réinitialiser les champs
        resetForm();
        
        // Fermer le dialogue et notifier le parent avec un délai
        setTimeout(() => {
          // Déclencher plusieurs actualisations des données
          onUserInvited();
          
          setTimeout(() => {
            onUserInvited();
            onOpenChange(false);
          }, 500);
        }, 300);
      } else {
        const errorMsg = result.error || "Une erreur est survenue lors de l'ajout de l'utilisateur";
        console.error("Erreur lors de l'invitation:", errorMsg);
        setErrorMessage(errorMsg);
        toast.error("Échec de l'ajout", { description: errorMsg });
      }
    } catch (error) {
      console.error("Exception lors de l'invitation:", error);
      const errorMsg = error instanceof Error ? error.message : "Une erreur inattendue est survenue";
      setErrorMessage(errorMsg);
      toast.error("Erreur", { description: errorMsg });
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
            Ajouter un nouvel utilisateur à l'application
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
              onValueChange={(value) => {
                // Restriction explicite à des valeurs de type UserRole
                if (value === "admin" || value === "growth" || value === "sdr") {
                  setRole(value as UserRole);
                } else {
                  console.error("Valeur de rôle invalide:", value);
                  setRole("sdr"); // Valeur par défaut
                }
              }}
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
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              "Ajouter l'utilisateur"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
