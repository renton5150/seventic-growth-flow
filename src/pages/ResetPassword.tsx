
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useToast } from "@/components/ui/use-toast";

const ResetPassword = () => {
  const { token } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [resetSuccessful, setResetSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expiredLink, setExpiredLink] = useState(false);
  const [expiredLinkMessage, setExpiredLinkMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isInvite, setIsInvite] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const type = searchParams.get("type");
    const emailParam = searchParams.get("email");

    if (emailParam) {
      setEmail(emailParam);
    }

    if (type === "invite") {
      setIsInvite(true);
    }
  }, [searchParams]);

  useEffect(() => {
    // Vérifier si le token est présent et valide
    if (!token) {
      setExpiredLink(true);
      setExpiredLinkMessage("Le lien de réinitialisation est invalide.");
      return;
    }

    // Optionnel: Envoyer une requête à Supabase pour valider le token côté serveur
    // Cela nécessite une fonction Edge ou une API route pour des raisons de sécurité
    // Exemple:
    // validateToken(token)
    //   .then(isValid => {
    //     if (!isValid) {
    //       setExpiredLink(true);
    //       setExpiredLinkMessage("Le lien de réinitialisation a expiré ou est invalide.");
    //     }
    //   });
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMatch(false);
      return;
    }

    setPasswordMatch(true);
    setLoading(true);

    const alertDescription = isInvite
      ? "Votre compte a été créé. Veuillez définir un mot de passe."
      : "Votre mot de passe a été réinitialisé avec succès.";

    try {
      if (!token) {
        console.error("Token manquant");
        setExpiredLink(true);
        setExpiredLinkMessage("Le lien de réinitialisation est invalide.");
        return;
      }

      // Utilisation correcte de l'API Supabase
      // La méthode updateUser et la propriété password existent sur UserAttributes
      // mais token doit être passé comme second argument
      const { error } = await supabase.auth.updateUser(
        { password: newPassword },
        { token }
      );

      if (error) {
        console.error("Erreur lors de la mise à jour du mot de passe:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description:
            "Une erreur s'est produite lors de la réinitialisation du mot de passe.",
        });
      } else {
        setResetSuccessful(true);
        toast({
          title: "Succès",
          description: alertDescription,
        });

        // Rediriger l'utilisateur après un court délai
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error(
        "Erreur inattendue lors de la mise à jour du mot de passe:",
        error
      );
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-4">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isInvite ? "Définir votre mot de passe" : "Réinitialiser le mot de passe"}
          </CardTitle>
          <CardDescription className="text-center">
            {isInvite
              ? "Bienvenue ! Veuillez définir votre mot de passe pour activer votre compte."
              : "Entrez votre nouveau mot de passe ci-dessous."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expiredLink ? (
            <Alert variant="default" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{expiredLinkMessage}</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  type="password"
                  id="newPassword"
                  placeholder="Entrez votre nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirmez votre nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {!passwordMatch && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>
                    Les mots de passe ne correspondent pas.
                  </AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Chargement..."
                  : isInvite
                  ? "Définir le mot de passe"
                  : "Réinitialiser le mot de passe"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
