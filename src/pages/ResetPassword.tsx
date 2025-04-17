
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

const ResetPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { error, setError, mode, isProcessingToken } = useResetSession();
  const [urlDebug, setUrlDebug] = useState<string>("");
  const [email, setEmail] = useState<string>("");

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
    try {
      const result = await resendInvitation(email);
      
      if (result.success) {
        toast.success("Nouvelle invitation envoyée avec succès", {
          description: "Veuillez vérifier votre boîte de réception"
        });
        // Recharger la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error("Échec de l'envoi de l'invitation", {
          description: result.error
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
          <ErrorDisplay error={error} />
          
          {isOtpExpired && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-md text-amber-800">
              <h3 className="font-bold mb-2">Lien d'invitation expiré</h3>
              <p className="mb-4">Le lien d'invitation que vous avez utilisé a expiré ou n'est plus valide.</p>
              {email && (
                <Button 
                  onClick={handleResendInvitation} 
                  variant="outline" 
                  className="w-full"
                  disabled={isResending}
                >
                  {isResending ? "Envoi en cours..." : "Demander un nouveau lien"}
                </Button>
              )}
              {!email && (
                <p className="text-sm text-amber-700">
                  Veuillez contacter un administrateur pour obtenir une nouvelle invitation.
                </p>
              )}
            </div>
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
