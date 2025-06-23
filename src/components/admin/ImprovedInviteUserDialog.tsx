
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Loader2, AlertCircle, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { createInvitation, createUserDirectly, resetUserPassword, CreateInvitationData } from "@/services/invitation/invitationService";
import { UserRole } from "@/types/types";

interface ImprovedInviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole?: UserRole;
  onUserInvited?: () => void;
}

export const ImprovedInviteUserDialog = ({ open, onOpenChange, defaultRole = "sdr", onUserInvited }: ImprovedInviteUserDialogProps) => {
  const [formData, setFormData] = useState<CreateInvitationData>({
    email: "",
    name: "",
    role: defaultRole
  });
  const [isLoading, setIsLoading] = useState(false);
  const [creationMode, setCreationMode] = useState<'direct' | 'invitation'>('direct');
  const [result, setResult] = useState<{ success: boolean; tempPassword?: string; message?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      let response;
      
      if (creationMode === 'direct') {
        response = await createUserDirectly(formData);
        if (response.success) {
          setResult({
            success: true,
            tempPassword: response.tempPassword,
            message: "Utilisateur créé avec succès !"
          });
          toast.success("Utilisateur créé avec succès !");
        }
      } else {
        response = await createInvitation(formData);
        if (response.success) {
          const message = response.userExists 
            ? "Lien de réinitialisation envoyé à l'utilisateur existant"
            : "Invitation envoyée par email";
          setResult({
            success: true,
            message: message
          });
          toast.success(message);
        }
      }
      
      if (!response.success) {
        toast.error(response.error || "Erreur lors de l'opération");
      } else if (onUserInvited) {
        setTimeout(() => onUserInvited(), 500);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (result?.tempPassword) {
      await navigator.clipboard.writeText(result.tempPassword);
      toast.success("Mot de passe copié");
    }
  };

  const handleClose = () => {
    setFormData({ email: "", name: "", role: defaultRole });
    setResult(null);
    setCreationMode('direct');
    
    if (onUserInvited) {
      onUserInvited();
    }
    
    onOpenChange(false);
  };

  // Affichage du succès pour création directe
  if (result?.success && result.tempPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Utilisateur créé avec succès !
            </DialogTitle>
            <DialogDescription>
              L'utilisateur a été créé et apparaît dans la liste des utilisateurs actifs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>{formData.name}</strong> ({formData.email}) créé avec le rôle <strong>{formData.role}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Email de connexion</Label>
              <Input value={formData.email} readOnly className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label>Mot de passe temporaire</Label>
              <div className="flex space-x-2">
                <Input
                  value={result.tempPassword}
                  readOnly
                  type="password"
                  className="font-mono text-sm bg-gray-50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                  title="Copier le mot de passe"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                L'utilisateur peut se connecter avec cet email et ce mot de passe temporaire.
                Il est recommandé de lui demander de changer son mot de passe.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Fermer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Affichage du succès pour invitation email
  if (result?.success && !result.tempPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Email envoyé avec succès !
            </DialogTitle>
            <DialogDescription>
              {result.message}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Un email a été envoyé à <strong>{formData.email}</strong> via votre SMTP laura.decoster@7tic.fr
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                L'utilisateur recevra un email avec les instructions pour se connecter ou réinitialiser son mot de passe.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Fermer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur</DialogTitle>
          <DialogDescription>
            Créez directement un utilisateur ou envoyez-lui une invitation par email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Mode de création</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={creationMode === 'direct' ? 'default' : 'outline'}
                onClick={() => setCreationMode('direct')}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-2" />
                Créer directement
              </Button>
              <Button
                type="button"
                variant={creationMode === 'invitation' ? 'default' : 'outline'}
                onClick={() => setCreationMode('invitation')}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Envoyer invitation
              </Button>
            </div>
            <p className="text-xs text-gray-600">
              {creationMode === 'direct' 
                ? "Utilisateur créé immédiatement avec mot de passe temporaire"
                : "Email d'invitation envoyé via votre SMTP laura.decoster@7tic.fr"
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="utilisateur@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              placeholder="Nom Prénom"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sdr">SDR</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {creationMode === 'direct' ? 'Création...' : 'Envoi...'}
                </>
              ) : (
                creationMode === 'direct' ? 'Créer l\'utilisateur' : "Envoyer l'invitation"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
