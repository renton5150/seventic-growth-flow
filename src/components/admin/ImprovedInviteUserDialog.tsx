
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Loader2, AlertCircle, User, Mail, ExternalLink, Eye, EyeOff } from "lucide-react";
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
  const [creationMode, setCreationMode] = useState<'direct' | 'invitation' | 'reset'>('direct');
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<{ 
    success: boolean; 
    tempPassword?: string; 
    actionLink?: string;
    message?: string; 
    method?: string;
    userExists?: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (creationMode === 'reset') {
      if (!formData.email) {
        toast.error("Veuillez saisir l'email");
        return;
      }
    } else {
      if (!formData.email || !formData.name) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }
    }

    setIsLoading(true);
    setResult(null);

    try {
      let response;
      
      if (creationMode === 'reset') {
        console.log("Mode réinitialisation mot de passe sélectionné");
        response = await resetUserPassword(formData.email);
        if (response.success) {
          setResult({
            success: true,
            actionLink: response.actionLink,
            message: "Lien de réinitialisation généré !",
            method: response.method
          });
          toast.success("Lien de réinitialisation généré avec succès !");
        }
      } else if (creationMode === 'direct') {
        console.log("Mode création directe sélectionné");
        response = await createUserDirectly(formData);
        if (response.success) {
          let message = "Utilisateur créé avec succès !";
          if (response.method === 'existing_user_reset') {
            message = "Utilisateur existant - Lien de réinitialisation généré !";
          }
          
          setResult({
            success: true,
            tempPassword: response.tempPassword,
            actionLink: response.actionLink,
            message: message,
            method: response.method,
            userExists: response.userExists
          });
          toast.success(message);
        }
      } else {
        console.log("Mode génération lien d'invitation sélectionné");
        response = await createInvitation(formData);
        if (response.success) {
          const message = response.userExists 
            ? "Lien de réinitialisation généré pour l'utilisateur existant"
            : "Lien d'invitation généré";
          setResult({
            success: true,
            actionLink: response.actionLink,
            message: message,
            method: response.method,
            userExists: response.userExists
          });
          toast.success(message);
        }
      }
      
      if (!response.success) {
        console.error("Erreur lors de l'opération:", response.error);
        toast.error(response.error || "Erreur lors de l'opération");
      } else if (onUserInvited) {
        setTimeout(() => onUserInvited(), 500);
      }
    } catch (error) {
      console.error("Exception lors de l'opération:", error);
      toast.error(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (result?.tempPassword) {
      try {
        await navigator.clipboard.writeText(result.tempPassword);
        toast.success("Mot de passe copié");
      } catch (error) {
        console.error("Erreur copie:", error);
        toast.error("Erreur lors de la copie");
      }
    }
  };

  const handleCopyLink = async () => {
    if (result?.actionLink) {
      try {
        await navigator.clipboard.writeText(result.actionLink);
        toast.success("Lien copié");
      } catch (error) {
        console.error("Erreur copie:", error);
        toast.error("Erreur lors de la copie");
      }
    }
  };

  const handleOpenLink = () => {
    if (result?.actionLink) {
      window.open(result.actionLink, '_blank');
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

  // Affichage du succès avec toutes les informations
  if (result?.success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Opération réussie !
            </DialogTitle>
            <DialogDescription>
              {result.message}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>{formData.name || formData.email}</strong> ({formData.email})
                {formData.role && (
                  <>
                    <br />Rôle: <strong>{formData.role}</strong>
                  </>
                )}
                <br />Méthode: <strong>{result.method}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Email de connexion</Label>
              <Input value={formData.email} readOnly className="bg-gray-50" />
            </div>

            {result.tempPassword && (
              <div className="space-y-2">
                <Label>Mot de passe temporaire</Label>
                <div className="flex space-x-2">
                  <Input
                    value={result.tempPassword}
                    readOnly
                    type={showPassword ? "text" : "password"}
                    className="font-mono text-sm bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
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
            )}

            {result.actionLink && (
              <div className="space-y-2">
                <Label>Lien d'accès direct</Label>
                <div className="flex space-x-2">
                  <Input
                    value={result.actionLink}
                    readOnly
                    className="font-mono text-xs bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    title="Copier le lien"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleOpenLink}
                    title="Ouvrir le lien"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {result.tempPassword ? (
                  <>
                    L'utilisateur peut se connecter avec cet email et ce mot de passe temporaire. 
                    Il est recommandé de lui demander de changer son mot de passe après la première connexion.
                  </>
                ) : (
                  <>
                    L'utilisateur peut utiliser le lien d'accès direct ci-dessus pour se connecter ou définir son mot de passe.
                  </>
                )}
                <br />
                <strong>Important :</strong> Partagez ces informations directement avec l'utilisateur car aucun email n'est envoyé automatiquement.
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
          <DialogTitle>Gestion utilisateur</DialogTitle>
          <DialogDescription>
            Créez un utilisateur, générez un lien d'invitation ou réinitialisez un mot de passe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Mode d'opération</Label>
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
                Générer lien
              </Button>
              <Button
                type="button"
                variant={creationMode === 'reset' ? 'default' : 'outline'}
                onClick={() => setCreationMode('reset')}
                className="flex-1"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Reset MDP
              </Button>
            </div>
            <p className="text-xs text-gray-600">
              {creationMode === 'direct' 
                ? "Créer un utilisateur avec mot de passe temporaire + lien d'accès direct"
                : creationMode === 'invitation'
                ? "Générer un lien d'invitation pour un nouvel utilisateur (pas d'email envoyé)"
                : "Générer un lien de réinitialisation pour un utilisateur existant"
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="utilisateur@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {creationMode !== 'reset' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
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
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {creationMode === 'direct' ? 'Création...' : creationMode === 'invitation' ? 'Génération...' : 'Génération...'}
                </>
              ) : (
                creationMode === 'direct' ? 'Créer l\'utilisateur' : creationMode === 'invitation' ? "Générer le lien" : "Générer lien reset"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
