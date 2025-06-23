import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Loader2, AlertCircle, AlertTriangle, Info, User } from "lucide-react";
import { toast } from "sonner";
import { createInvitation, createUserDirectly, CreateInvitationData, InvitationResponse } from "@/services/invitation/invitationService";
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
    role: defaultRole,
    force_create: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [invitationResult, setInvitationResult] = useState<InvitationResponse | null>(null);
  const [showForceOption, setShowForceOption] = useState(false);
  const [creationMode, setCreationMode] = useState<'invitation' | 'direct'>('direct');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setInvitationResult(null);
    setShowForceOption(false);
    setTempPassword(null);

    try {
      let result: InvitationResponse;
      
      if (creationMode === 'direct') {
        result = await createUserDirectly(formData);
        if (result.success) {
          toast.success("Utilisateur créé avec succès !");
          setTempPassword((result as any).user?.tempPassword);
          // Rafraîchir immédiatement la liste des utilisateurs
          if (onUserInvited) {
            setTimeout(() => onUserInvited(), 500);
          }
        }
      } else {
        result = await createInvitation(formData);
        if (result.success && result.invitationUrl) {
          setInvitationUrl(result.invitationUrl);
          if (result.userExists) {
            toast.success("Invitation créée pour un utilisateur existant");
          } else {
            toast.success("Invitation créée avec succès");
          }
          if (onUserInvited) {
            setTimeout(() => onUserInvited(), 500);
          }
        }
      }
      
      setInvitationResult(result);
      
      if (!result.success) {
        if (result.errorType === 'active_invitation_exists' || result.errorType === 'user_already_exists') {
          setShowForceOption(true);
        } else {
          toast.error(result.error || "Erreur lors de la création");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue");
      setInvitationResult({ success: false, error: error instanceof Error ? error.message : "Erreur inconnue" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceCreate = async () => {
    setIsLoading(true);
    setFormData(prev => ({ ...prev, force_create: true }));
    
    try {
      const result = await createInvitation({ ...formData, force_create: true });
      setInvitationResult(result);
      
      if (result.success && result.invitationUrl) {
        setInvitationUrl(result.invitationUrl);
        toast.success("Nouvelle invitation créée avec succès");
        if (onUserInvited) {
          setTimeout(() => onUserInvited(), 500);
        }
        setShowForceOption(false);
      } else {
        toast.error(result.error || "Erreur lors de la création forcée");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (invitationUrl) {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      toast.success("Lien d'invitation copié");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword);
      toast.success("Mot de passe copié");
    }
  };

  const handleClose = () => {
    setFormData({ email: "", name: "", role: defaultRole, force_create: false });
    setInvitationUrl(null);
    setInvitationResult(null);
    setShowForceOption(false);
    setCopied(false);
    setTempPassword(null);
    setCreationMode('direct');
    
    // Rafraîchir une dernière fois la liste avant de fermer
    if (onUserInvited) {
      onUserInvited();
    }
    
    onOpenChange(false);
  };

  // Si utilisateur créé directement
  if (invitationResult?.success && creationMode === 'direct' && tempPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Utilisateur créé avec succès !
            </DialogTitle>
            <DialogDescription>
              L'utilisateur a été créé et ajouté à la liste. Voici ses informations de connexion :
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>{formData.name}</strong> ({formData.email}) a été créé avec le rôle <strong>{formData.role}</strong>
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
                  value={tempPassword}
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
                L'utilisateur peut maintenant se connecter avec cet email et ce mot de passe temporaire. 
                Il est recommandé de lui demander de changer son mot de passe lors de sa première connexion.
                <br /><br />
                <strong>L'utilisateur apparaîtra dans la liste des utilisateurs actifs.</strong>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderErrorAlert = () => {
    if (!invitationResult || invitationResult.success) return null;

    if (invitationResult.errorType === 'active_invitation_exists') {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Une invitation active existe déjà pour cet email. Elle expire le{" "}
            {invitationResult.existingInvitation?.expires_at ? 
              new Date(invitationResult.existingInvitation.expires_at).toLocaleDateString('fr-FR') : 
              'date inconnue'
            }.
          </AlertDescription>
        </Alert>
      );
    }

    if (invitationResult.errorType === 'user_already_exists') {
      return (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Un utilisateur avec cet email existe déjà dans le système.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{invitationResult.error}</AlertDescription>
      </Alert>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur</DialogTitle>
          <DialogDescription>
            Créez directement un utilisateur ou envoyez-lui une invitation par email.
          </DialogDescription>
        </DialogHeader>

        {!invitationUrl ? (
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
                  <Copy className="h-4 w-4 mr-2" />
                  Envoyer invitation
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                {creationMode === 'direct' 
                  ? "L'utilisateur sera créé immédiatement avec un mot de passe temporaire et apparaîtra dans la liste"
                  : "Un lien d'invitation sera généré pour que l'utilisateur puisse s'inscrire"
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

            {renderErrorAlert()}

            {showForceOption && (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium text-sm">Options avancées</h4>
                <p className="text-sm text-gray-600">
                  Vous pouvez forcer la création d'une nouvelle invitation. Cela remplacera toute invitation existante.
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleForceCreate}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création forcée...
                    </>
                  ) : (
                    "Forcer la création d'une nouvelle invitation"
                  )}
                </Button>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading || showForceOption}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {creationMode === 'direct' ? 'Création...' : 'Création invitation...'}
                  </>
                ) : (
                  creationMode === 'direct' ? 'Créer l\'utilisateur' : "Créer l'invitation"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Invitation créée avec succès ! Partagez ce lien avec l'utilisateur :
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Lien d'invitation</Label>
              <div className="flex space-x-2">
                <Input
                  value={invitationUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  title="Copier le lien"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {invitationResult?.userExists && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Note : Cet utilisateur existe déjà dans le système. L'invitation lui permettra de réinitialiser son accès.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ce lien est valide pendant 7 jours. L'utilisateur pourra créer son compte en cliquant dessus.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
