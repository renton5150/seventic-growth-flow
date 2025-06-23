
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { validateInvitationToken, completeSignup } from "@/services/invitation/invitationService";

const InviteSignup = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError("Token d'invitation manquant");
      setIsValidating(false);
      return;
    }

    try {
      const result = await validateInvitationToken(token);
      
      if (result.success) {
        setInvitation(result.invitation);
      } else {
        setError(result.error || "Token d'invitation invalide");
      }
    } catch (error) {
      setError("Erreur lors de la validation du token");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (!token) return;

    setIsSigningUp(true);

    try {
      const result = await completeSignup(token, password);
      
      if (result.success) {
        toast.success("Compte créé avec succès ! Redirection...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(result.error || "Erreur lors de la création du compte");
      }
    } catch (error) {
      setError("Erreur lors de la création du compte");
    } finally {
      setIsSigningUp(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Validation de l'invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invitation invalide</CardTitle>
            <CardDescription className="text-center">
              Cette invitation n'est pas valide ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate("/login")} variant="outline">
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Créer votre compte</CardTitle>
          <CardDescription className="text-center">
            Vous avez été invité(e) à rejoindre Seventic
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitation && (
            <div className="mb-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{invitation.name}</strong><br />
                  Email : {invitation.email}<br />
                  Rôle : {invitation.role}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSigningUp}>
              {isSigningUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création du compte...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            Vous avez déjà un compte ?{" "}
            <Button variant="link" onClick={() => navigate("/login")} className="p-0">
              Se connecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteSignup;
