import { useState } from "react";
import { Copy, CheckCircle, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from "@/types/types";
import { resetUserPassword } from "@/services/invitation/invitationService";
import { toast } from "sonner";

interface ResetPasswordDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResetPasswordDialog = ({ user, open, onOpenChange }: ResetPasswordDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const result = await resetUserPassword(user.email);
      
      if (result.success && result.actionLink) {
        setResetLink(result.actionLink);
        toast.success("Lien de réinitialisation généré avec succès");
      } else {
        toast.error(result.error || "Erreur lors de la génération du lien");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la génération du lien");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (resetLink) {
      try {
        await navigator.clipboard.writeText(resetLink);
        setCopied(true);
        toast.success("Lien copié dans le presse-papiers");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error("Impossible de copier le lien");
      }
    }
  };

  const handleOpenLink = () => {
    if (resetLink) {
      window.open(resetLink, '_blank');
    }
  };

  const handleClose = () => {
    setResetLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          <DialogDescription>
            Générer un lien de réinitialisation pour {user.name} ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!resetLink ? (
            <>
              <Alert>
                <AlertDescription>
                  Un lien de réinitialisation sera généré que vous pourrez envoyer à l'utilisateur.
                  Ce lien lui permettra de définir un nouveau mot de passe.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleGenerateLink} 
                  disabled={isGenerating}
                >
                  {isGenerating ? "Génération..." : "Générer le lien"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Lien de réinitialisation généré avec succès !
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lien de réinitialisation :</label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <code className="flex-1 text-xs break-all">
                    {resetLink}
                  </code>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleOpenLink}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir
                </Button>
                <Button onClick={handleCopyLink}>
                  {copied ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? "Copié !" : "Copier"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};