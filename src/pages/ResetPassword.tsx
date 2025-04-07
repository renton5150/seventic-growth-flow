
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm } from "@/components/auth/reset-password/PasswordForm";
import { SuccessMessage } from "@/components/auth/reset-password/SuccessMessage";
import { useResetSession } from "@/components/auth/reset-password/useResetSession";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { error, setError, mode, isProcessingToken } = useResetSession();
  const [urlDebug, setUrlDebug] = useState<string>("");

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

  // Si nous sommes encore en train de traiter le jeton, afficher un indicateur de chargement
  if (isProcessingToken) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Traitement en cours...
            </CardTitle>
            <CardDescription className="text-center">
              Nous vérifions votre lien d'authentification
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seventic-500 mb-4"></div>
            <p className="text-center text-gray-600">
              Authentification en cours, veuillez patienter...
            </p>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

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
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isSuccess ? (
            <SuccessMessage mode={mode} />
          ) : (
            <PasswordForm 
              mode={mode} 
              onSuccess={handleSuccess} 
              onError={handleError} 
            />
          )}
          
          {import.meta.env.DEV && urlDebug && (
            <div className="mt-4 p-2 bg-gray-100 text-xs text-gray-600 rounded">
              <p className="font-mono break-all">Debug: {urlDebug}</p>
            </div>
          )}
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
