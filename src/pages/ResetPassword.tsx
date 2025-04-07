
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm } from "@/components/auth/reset-password/PasswordForm";
import { SuccessMessage } from "@/components/auth/reset-password/SuccessMessage";
import { useResetSession } from "@/components/auth/reset-password/useResetSession";
import { ErrorMessage } from "@/components/auth/login/ErrorMessage";

const ResetPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const { error, setError, mode } = useResetSession();

  const handleSuccess = () => {
    setIsSuccess(true);
  };

  const handleError = (message: string) => {
    setError(message);
  };

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
