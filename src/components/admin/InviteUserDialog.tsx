
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/types/types";
import { createUser } from "@/services/user";
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
        // Close the dialog first, before showing the toast and notifying the parent
        onOpenChange(false);
        
        // Small delay to allow dialog animation to complete
        setTimeout(() => {
          // Notify success after dialog closes
          toast.success("Utilisateur ajouté avec succès", {
            description: `${name} (${email}) a été ajouté en tant que ${role}`
          });
          
          // Reset form fields
          resetForm();
          
          // Wait a bit more before refreshing data to avoid UI freeze
          setTimeout(() => {
            onUserInvited();
          }, 300);
        }, 300);
      } else {
        const errorMsg = result.error || "Une erreur est survenue lors de l'ajout de l'utilisateur";
        console.error("Erreur lors de l'invitation:", errorMsg);
        setErrorMessage(errorMsg);
        toast.error("Échec de l'ajout", { description: errorMsg });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Exception lors de l'invitation:", error);
      const errorMsg = error instanceof Error ? error.message : "Une erreur inattendue est survenue";
      setErrorMessage(errorMsg);
      toast.error("Erreur", { description: errorMsg });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isLoading) {
        if (!isOpen) {
          // Allow time for potential toast messages to show before resetting the form
          setTimeout(() => {
            resetForm();
          }, 300);
        } else {
          setRole(defaultRole);
        }
        onOpenChange(isOpen);
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
