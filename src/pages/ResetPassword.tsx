
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm } from "@/components/auth/reset-password/PasswordForm";
import { SuccessMessage } from "@/components/auth/reset-password/SuccessMessage";
import { useResetSession } from "@/components/auth/reset-password/useResetSession";
import { ErrorMessage } from "@/components/auth/login/ErrorMessage";
import { toast } from "sonner";

const ResetPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { error, setError, mode, isProcessingToken } = useResetSession();

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
              ? "Veuillez définir un mot de passe pour votre nouveau compte" 
              : "Veuillez entrer votre nouveau mot de passe"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorMessage error={error} />
          
          {isSuccess ? (
            <SuccessMessage mode={mode} />
          ) : (
            <PasswordForm 
              mode={mode} 
              onSuccess={handleSuccess} 
              onError={handleError} 
            />
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
