
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [resetSuccessful, setResetSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProcessingHash, setIsProcessingHash] = useState(true);
  const [expiredLink, setExpiredLink] = useState(false);
  const [expiredLinkMessage, setExpiredLinkMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isInvite, setIsInvite] = useState(false);

  useEffect(() => {
    const processHash = async () => {
      try {
        console.log("Traitement du hash URL pour réinitialisation");
        
        // Extraire les paramètres de l'URL
        const type = searchParams.get("type");
        const emailParam = searchParams.get("email");
        
        // Récupérer le hash de l'URL (après #)
        const hash = window.location.hash;
        
        if (emailParam) {
          console.log("Email trouvé dans les paramètres:", emailParam);
          setEmail(emailParam);
        }
        
        if (type === "invite") {
          console.log("Type d'invitation détecté");
          setIsInvite(true);
        }
        
        // Si nous avons un hash dans l'URL, il pourrait contenir un token valide
        if (hash && hash.length > 1) {
          console.log("Hash détecté dans l'URL, tentative de récupération du token");
          
          // Essayer d'extraire et de valider le token du hash
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Erreur lors de la récupération du token:", error);
            setExpiredLink(true);
            setExpiredLinkMessage("Le lien de réinitialisation est invalide ou a expiré.");
          } else if (data?.session) {
            console.log("Session récupérée avec succès du hash");
            // La session est maintenant stockée, l'utilisateur peut réinitialiser son mot de passe
            setExpiredLink(false);
            
            // Si l'e-mail n'est pas dans les paramètres mais dans la session
            if (!emailParam && data.session.user?.email) {
              setEmail(data.session.user.email);
            }
          } else {
            console.warn("Aucune session trouvée dans l'URL");
            setExpiredLink(true);
            setExpiredLinkMessage("Le lien de réinitialisation est invalide ou a expiré.");
          }
        } else {
          // Vérifier si nous avons une session active
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log("Session active détectée, l'utilisateur peut réinitialiser son mot de passe");
            setExpiredLink(false);
            
            if (!emailParam && session.user?.email) {
              setEmail(session.user.email);
            }
          } else {
            console.warn("Aucune session active et pas de hash dans l'URL");
            setExpiredLink(true);
            setExpiredLinkMessage("Le lien de réinitialisation est invalide ou a expiré.");
          }
        }
      } catch (error) {
        console.error("Erreur lors du traitement de l'URL de réinitialisation:", error);
        setExpiredLink(true);
        setExpiredLinkMessage("Une erreur s'est produite lors du traitement du lien.");
      } finally {
        setIsProcessingHash(false);
      }
    };
    
    processHash();
  }, [searchParams, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMatch(false);
      return;
    }

    setPasswordMatch(true);
    setLoading(true);

    try {
      // Utiliser updateUser sans token, car la session est déjà établie
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        console.error("Erreur lors de la mise à jour du mot de passe:", error);
        toast.error("Une erreur s'est produite lors de la réinitialisation du mot de passe.");
      } else {
        setResetSuccessful(true);
        toast.success(isInvite 
          ? "Votre compte a été créé. Vous pouvez maintenant vous connecter." 
          : "Votre mot de passe a été réinitialisé avec succès.");

        // Rediriger l'utilisateur après un court délai
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la mise à jour du mot de passe:", error);
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour demander un nouveau lien de réinitialisation
  const handleRequestNewLink = async () => {
    if (!email) {
      toast.error("Email manquant. Veuillez contacter un administrateur.");
      return;
    }

    setLoading(true);
    try {
      // Utilisation du redirectTo avec le type approprié
      const redirectUrl = isInvite 
        ? `${window.location.origin}/reset-password?type=invite&email=${encodeURIComponent(email)}`
        : `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`;
        
      console.log("Demande d'un nouveau lien avec redirection vers:", redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Erreur lors de l'envoi du lien:", error);
        toast.error("Impossible d'envoyer un nouveau lien de réinitialisation.");
      } else {
        toast.success("Un nouveau lien de réinitialisation a été envoyé à votre adresse email.");
      }
    } catch (err) {
      console.error("Exception lors de l'envoi du lien:", err);
      toast.error("Une erreur s'est produite lors de l'envoi du lien.");
    } finally {
      setLoading(false);
    }
  };

  if (isProcessingHash) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md p-4">
          <CardContent className="flex flex-col items-center py-8">
            <div className="animate-pulse text-center">
              <p className="text-lg font-medium">Traitement du lien de réinitialisation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lien d'invitation expiré</AlertTitle>
                <AlertDescription>{expiredLinkMessage}</AlertDescription>
              </Alert>
              {email && (
                <div className="mt-4 text-center">
                  <p className="mb-4">Souhaitez-vous recevoir un nouveau lien ?</p>
                  <Button 
                    onClick={handleRequestNewLink} 
                    disabled={loading} 
                    className="w-full"
                  >
                    {loading ? "Envoi en cours..." : "Demander un nouveau lien"}
                  </Button>
                </div>
              )}
              {!email && (
                <div className="mt-4 text-center">
                  <p>Veuillez contacter un administrateur pour obtenir une nouvelle invitation.</p>
                </div>
              )}
            </>
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
