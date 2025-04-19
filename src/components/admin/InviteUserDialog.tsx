
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
  const [internalOpen, setInternalOpen] = useState(false);

  // Synchroniser avec l'état externe
  useState(() => {
    setInternalOpen(open);
    if (open) {
      setRole(defaultRole);
    }
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole(defaultRole);
    setErrorMessage(null);
    setIsLoading(false);
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
      
      // Fermer d'abord la boîte de dialogue
      setInternalOpen(false);
      onOpenChange(false);
      
      // Afficher un toast de chargement
      const toastId = toast.loading(`Ajout de l'utilisateur ${name}...`);
      
      // Attendre un court délai pour s'assurer que la boîte de dialogue est fermée
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Créer l'utilisateur
      const result = await createUser(email, name, role);
      
      if (result.success) {
        // Mettre à jour le toast
        toast.success("Utilisateur ajouté avec succès", {
          id: toastId,
          description: `${name} (${email}) a été ajouté en tant que ${role}`
        });
        
        // Réinitialiser le formulaire
        resetForm();
        
        // Notifier le composant parent
        onUserInvited();
      } else {
        const errorMsg = result.error || "Une erreur est survenue lors de l'ajout de l'utilisateur";
        console.error("Erreur lors de l'invitation:", errorMsg);
        
        toast.error("Échec de l'ajout", { 
          id: toastId,
          description: errorMsg 
        });
        
        // Rétablir l'état du formulaire
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Exception lors de l'invitation:", error);
      const errorMsg = error instanceof Error ? error.message : "Une erreur inattendue est survenue";
      
      toast.error("Erreur", { description: errorMsg });
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isLoading) {
      setInternalOpen(isOpen);
      onOpenChange(isOpen);
      
      if (!isOpen) {
        // Réinitialiser le formulaire après fermeture
        setTimeout(resetForm, 300);
      } else {
        // Réinitialiser seulement le rôle à l'ouverture
        setRole(defaultRole);
      }
    }
  };

  return (
    <Dialog open={internalOpen} onOpenChange={handleOpenChange}>
      <DialogContent onEscapeKeyDown={(e) => {
        if (isLoading) {
          e.preventDefault();
        }
      }}>
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
                if (value === "admin" || value === "growth" || value === "sdr") {
                  setRole(value as UserRole);
                } else {
                  setRole("sdr");
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
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
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
