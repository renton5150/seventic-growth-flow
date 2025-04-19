
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm } from "@/components/auth/reset-password/PasswordForm";
import { SuccessMessage } from "@/components/auth/reset-password/SuccessMessage";
import { ProcessingState } from "@/components/auth/reset-password/components/ProcessingState";
import { ErrorDisplay } from "@/components/auth/reset-password/components/ErrorDisplay";
import { DebugInfo } from "@/components/auth/reset-password/components/DebugInfo";
import { useResetSession } from "@/components/auth/reset-password/useResetSession";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resendInvitation } from "@/services/user/userInvitation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";

const ResetPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { error, setError, mode, isProcessingToken } = useResetSession();
  const [urlDebug, setUrlDebug] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Extrait l'email du token ou des paramètres d'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));
    
    // Tenter de récupérer l'email des paramètres
    const emailParam = params.get("email") || hashParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
      console.log("Email trouvé dans les paramètres:", emailParam);
    }
  }, [location]);

  // Affichage des paramètres d'URL pour le débogage
  useEffect(() => {
    const hashParams = location.hash 
      ? Object.fromEntries(new URLSearchParams(location.hash.substring(1))) 
      : {};
    
    const searchParams = Object.fromEntries(new URLSearchParams(location.search));
    
    setUrlDebug(`Hash params: ${JSON.stringify(hashParams)}, Search params: ${JSON.stringify(searchParams)}`);
  }, [location]);

  // Après un succès, rediriger vers la page de connexion après un délai
  useEffect(() => {
    if (isSuccess) {
      const redirectTimer = setTimeout(() => {
        navigate("/login");
        toast.success("Vous pouvez maintenant vous connecter avec votre nouveau mot de passe");
      }, 3000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isSuccess, navigate]);

  const handleSuccess = () => {
    setIsSuccess(true);
  };

  const handleError = (message: string) => {
    setError(message);
  };
  
  const handleResendInvitation = async () => {
    if (!email) {
      toast.error("Aucune adresse email disponible pour renvoyer l'invitation");
      return;
    }

    setIsResending(true);
    setResendAttempts(prev => prev + 1);
    
    try {
      console.log("Tentative de renvoi d'invitation pour:", email);
      const result = await resendInvitation(email);
      
      if (result.success) {
        setResendSuccess(true);
        toast.success("Nouvelle invitation envoyée avec succès", {
          description: "Veuillez vérifier votre boîte de réception et vos spams"
        });
        
        // Recharger la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        console.error("Échec du renvoi:", result.error);
        toast.error("Échec de l'envoi de l'invitation", {
          description: result.error || "Une erreur est survenue"
        });
      }
    } catch (err) {
      console.error("Erreur lors du renvoi de l'invitation:", err);
      toast.error("Une erreur s'est produite lors du renvoi de l'invitation");
    } finally {
      setIsResending(false);
    }
  };

  // Si nous sommes encore en train de traiter le jeton, afficher un indicateur de chargement
  if (isProcessingToken) {
    return (
      <AuthLayout>
        <ProcessingState />
      </AuthLayout>
    );
  }

  // Si l'erreur concerne un OTP expiré, afficher un message spécifique
  const isOtpExpired = error?.includes("expiré") || 
                       location.search.includes("error_code=otp_expired") ||
                       location.hash.includes("error_code=otp_expired");

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {mode === "setup" ? "Configurer votre mot de passe" : "Réinitialiser votre mot de passe"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "setup" 
              ? "Veuillez définir un mot de passe pour votre compte" 
              : "Veuillez entrer votre nouveau mot de passe"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOtpExpired && <ErrorDisplay error={error} />}
          
          {isOtpExpired && (
            <Alert variant="warning" className="mb-6 bg-amber-50 border border-amber-300">
              <AlertCircle className="h-4 w-4 text-amber-800" />
              <AlertTitle className="text-amber-800 font-bold">Lien d'invitation expiré</AlertTitle>
              <AlertDescription className="text-amber-800">
                <p className="mb-4">Le lien d'invitation que vous avez utilisé a expiré ou n'est plus valide.</p>
                {email && (
                  <div className="space-y-2">
                    {resendSuccess ? (
                      <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700">
                        Nouvelle invitation envoyée avec succès. Veuillez vérifier votre boîte de réception et vos spams.
                      </div>
                    ) : (
                      <Button 
                        onClick={handleResendInvitation} 
                        variant="outline" 
                        className="w-full flex items-center justify-center gap-2"
                        disabled={isResending}
                      >
                        {isResending ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Demander un nouveau lien
                          </>
                        )}
                      </Button>
                    )}
                    
                    {resendAttempts > 0 && !resendSuccess && (
                      <p className="text-xs text-amber-700">
                        Si vous ne recevez toujours pas l'email, vérifiez vos spams ou contactez un administrateur.
                      </p>
                    )}
                  </div>
                )}
                {!email && (
                  <p className="text-sm text-amber-700">
                    Veuillez contacter un administrateur pour obtenir une nouvelle invitation.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {isSuccess ? (
            <SuccessMessage mode={mode} />
          ) : (
            !isOtpExpired && (
              <PasswordForm 
                mode={mode} 
                onSuccess={handleSuccess} 
                onError={handleError} 
              />
            )
          )}
          
          <DebugInfo debugInfo={urlDebug} />
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-muted-foreground">
            <Link to="/login" className="text-seventic-500 hover:text-seventic-600">
              Retourner à la page de connexion
            </Link>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
};

export default ResetPassword;
