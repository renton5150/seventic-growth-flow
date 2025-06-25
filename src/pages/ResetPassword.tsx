
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [resetSuccessful, setResetSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isInvite, setIsInvite] = useState(false);
  const [samePasswordError, setSamePasswordError] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        console.log("Traitement de la réinitialisation de mot de passe");
        console.log("URL complète:", window.location.href);
        
        // Extraire les paramètres de l'URL
        const type = searchParams.get("type");
        const emailParam = searchParams.get("email");
        const error = searchParams.get("error");
        const errorCode = searchParams.get("error_code");
        const errorDescription = searchParams.get("error_description");
        
        console.log("Paramètres extraits:", { type, emailParam, error, errorCode, errorDescription });
        
        if (emailParam) {
          setEmail(emailParam);
        }
        
        if (type === "invite") {
          setIsInvite(true);
        } else if (type === "recovery") {
          setIsInvite(false);
        }
        
        // GESTION PRIORITAIRE DES ERREURS
        if (error || errorCode) {
          console.error("❌ Erreur détectée dans l'URL:", { error, errorCode, errorDescription });
          
          if (errorCode === "otp_expired" || error === "access_denied") {
            setAuthError("Le lien a expiré ou n'est plus valide. Veuillez demander un nouveau lien de réinitialisation.");
          } else {
            setAuthError(errorDescription || error || "Une erreur s'est produite lors de l'authentification.");
          }
          setIsProcessingAuth(false);
          return;
        }
        
        // Traitement du hash s'il est présent
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
          console.log("Hash détecté, tentative d'extraction des tokens");
          
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const tokenType = hashParams.get('type');
          const hashError = hashParams.get('error');
          
          if (hashError) {
            console.error("Erreur dans le hash:", hashError);
            setAuthError(`Erreur d'authentification: ${hashError}`);
            setIsProcessingAuth(false);
            return;
          }
          
          if (accessToken && refreshToken) {
            console.log("Tokens trouvés, configuration de la session");
            
            try {
              const { data, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (sessionError) {
                console.error("Erreur lors de la configuration de la session:", sessionError);
                setAuthError("Lien expiré ou invalide. Veuillez demander un nouveau lien.");
              } else {
                console.log("Session configurée avec succès");
                setHasValidSession(true);
                
                if (!emailParam && data.session?.user?.email) {
                  setEmail(data.session.user.email);
                }
                
                if (tokenType === "signup" || type === "invite") {
                  setIsInvite(true);
                } else if (tokenType === "recovery" || type === "recovery") {
                  setIsInvite(false);
                }
              }
            } catch (err) {
              console.error("Exception lors de la configuration de session:", err);
              setAuthError("Erreur lors du traitement du lien d'authentification.");
            }
          } else {
            console.warn("Tokens manquants dans le hash");
            setAuthError("Lien d'authentification invalide ou incomplet.");
          }
        } else {
          // Pas de hash, vérifier s'il y a une session active
          console.log("Pas de hash, vérification de la session existante");
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Erreur lors de la récupération de session:", sessionError);
            setAuthError("Erreur lors de la vérification de l'authentification.");
          } else if (session) {
            console.log("Session active trouvée");
            setHasValidSession(true);
            
            if (!emailParam && session.user?.email) {
              setEmail(session.user.email);
            }
          } else {
            console.warn("Aucune session active et pas de tokens dans l'URL");
            setAuthError("Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.");
          }
        }
      } catch (error) {
        console.error("Erreur lors du traitement de l'authentification:", error);
        setAuthError("Une erreur s'est produite lors du traitement du lien.");
      } finally {
        setIsProcessingAuth(false);
      }
    };
    
    handlePasswordReset();
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMatch(false);
      return;
    }

    setPasswordMatch(true);
    setLoading(true);
    setSamePasswordError(false);

    try {
      console.log("Tentative de mise à jour du mot de passe");
      
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        console.error("Erreur lors de la mise à jour du mot de passe:", error);
        
        if (error.message.includes("New password should be different from the old password") || 
            error.message.includes("same_password")) {
          setSamePasswordError(true);
          toast.error("Mot de passe identique", {
            description: "Votre nouveau mot de passe doit être différent de l'ancien"
          });
        } else {
          toast.error("Erreur lors de la réinitialisation", {
            description: error.message
          });
        }
      } else {
        setResetSuccessful(true);
        toast.success(isInvite 
          ? "Votre compte a été créé avec succès !" 
          : "Votre mot de passe a été réinitialisé avec succès !");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = async () => {
    if (!email) {
      toast.error("Email manquant. Veuillez contacter un administrateur.");
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth-callback?type=${isInvite ? 'invite' : 'recovery'}&email=${encodeURIComponent(email)}`;
      
      console.log("Demande d'un nouveau lien avec URL:", redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Erreur lors de l'envoi du nouveau lien:", error);
        toast.error("Impossible d'envoyer un nouveau lien.");
      } else {
        toast.success("Un nouveau lien a été envoyé à votre adresse email.");
      }
    } catch (err) {
      console.error("Exception lors de l'envoi du lien:", err);
      toast.error("Une erreur s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  if (isProcessingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md p-4">
          <CardContent className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-lg font-medium">Traitement du lien de réinitialisation...</p>
            <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
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
          {authError ? (
            <>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Problème d'authentification</AlertTitle>
                <AlertDescription className="whitespace-pre-line">{authError}</AlertDescription>
              </Alert>
              {email && (
                <div className="mt-4 text-center">
                  <p className="mb-4 text-sm">Souhaitez-vous recevoir un nouveau lien ?</p>
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
                  <p className="text-sm mb-4">Veuillez contacter un administrateur pour obtenir une nouvelle invitation.</p>
                  <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
                    Retour à la connexion
                  </Button>
                </div>
              )}
            </>
          ) : hasValidSession ? (
            <>
              {resetSuccessful ? (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Succès !</AlertTitle>
                  <AlertDescription>
                    {isInvite 
                      ? "Votre compte a été créé. Redirection vers la page de connexion..." 
                      : "Votre mot de passe a été réinitialisé. Redirection vers la page de connexion..."}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {samePasswordError && (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Mot de passe identique</AlertTitle>
                      <AlertDescription>
                        Votre nouveau mot de passe doit être différent de votre mot de passe actuel.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword">
                        {samePasswordError ? "Nouveau mot de passe (différent de l'ancien)" : "Nouveau mot de passe"}
                      </Label>
                      <Input
                        type="password"
                        id="newPassword"
                        placeholder="Entrez votre nouveau mot de passe"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setSamePasswordError(false);
                        }}
                        required
                        className={samePasswordError ? "border-orange-300 focus:border-orange-500" : ""}
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
                </>
              )}
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Session invalide</AlertTitle>
              <AlertDescription>
                Impossible de valider votre session. Veuillez demander un nouveau lien de réinitialisation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
