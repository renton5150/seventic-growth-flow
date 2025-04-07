
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField } from "@/components/auth/login/FormField";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, KeyRound, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { ErrorMessage } from "@/components/auth/login/ErrorMessage";

// Schéma de validation pour le formulaire
const passwordSchema = z.object({
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .refine(val => /[A-Z]/.test(val), "Le mot de passe doit contenir au moins une majuscule")
    .refine(val => /[0-9]/.test(val), "Le mot de passe doit contenir au moins un chiffre"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const ResetPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mode, setMode] = useState<"reset" | "setup">("reset");
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Récupérer les paramètres de l'URL et configurer la session
  useEffect(() => {
    const setupSession = async () => {
      try {
        // Essayer d'abord de récupérer les tokens depuis l'URL
        let queryParams = new URLSearchParams(location.search);
        let accessToken = queryParams.get("access_token");
        let refreshToken = queryParams.get("refresh_token");
        let type = queryParams.get("type");

        // Si pas de tokens dans les query params, essayer depuis le hash
        if (!accessToken) {
          const hashParams = new URLSearchParams(location.hash.substring(1));
          accessToken = hashParams.get("access_token");
          refreshToken = hashParams.get("refresh_token");
          type = hashParams.get("type");
        }

        // Vérifier si on a un token de vérification d'email
        if (location.hash && location.hash.includes("type=signup")) {
          setMode("setup");
        } else if (type === "signup") {
          setMode("setup");
        }

        // Si on a un token, configurer la session
        if (accessToken) {
          console.log("Access token trouvé, configuration de la session");
          
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            console.error("Erreur lors de la configuration de la session:", error);
            setError(`Erreur d'authentification: ${error.message}`);
          }
        } else {
          // Vérifier s'il y a un code d'erreur dans l'URL
          const errorCode = queryParams.get("error");
          const errorDescription = queryParams.get("error_description");
          
          if (errorCode) {
            console.error("Erreur dans les paramètres URL:", errorCode, errorDescription);
            setError(`Erreur: ${errorDescription || errorCode}`);
          } else if (!location.hash && !queryParams.toString()) {
            // Si aucun paramètre et aucun hash, probablement accès direct à la page
            setError("Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.");
          }
        }
      } catch (err) {
        console.error("Erreur lors de l'analyse des paramètres URL:", err);
        setError("Une erreur s'est produite lors du traitement du lien. Veuillez réessayer ou demander un nouveau lien.");
      }
    };

    setupSession();
  }, [location]);

  const handleSubmit = async (values: PasswordFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        console.error("Erreur lors de la mise à jour du mot de passe:", error);
        setError(error.message);
        setIsSubmitting(false);
        return;
      }

      // Succès
      setIsSuccess(true);
      toast.success(mode === "setup" ? 
        "Mot de passe défini avec succès" : 
        "Mot de passe réinitialisé avec succès");
      
      // Rediriger vers la page de connexion après quelques secondes
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Erreur inattendue:", error);
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="text-center py-4">
              <div className="mx-auto bg-green-100 text-green-800 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">
                {mode === "setup" ? "Compte configuré avec succès!" : "Mot de passe mis à jour!"}
              </h3>
              <p className="text-gray-600 mb-4">
                {mode === "setup" 
                  ? "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe." 
                  : "Votre mot de passe a été réinitialisé avec succès."}
              </p>
              <p className="text-sm text-gray-500">
                Redirection vers la page de connexion...
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  label="Nouveau mot de passe"
                  isPassword
                  showPassword={false}
                  onTogglePassword={() => {}}
                  icon={<KeyRound className="h-4 w-4" />}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  label="Confirmer le mot de passe"
                  isPassword
                  showPassword={false}
                  onTogglePassword={() => {}}
                  icon={<KeyRound className="h-4 w-4" />}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-seventic-500 hover:bg-seventic-600" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Traitement en cours...
                    </>
                  ) : (
                    mode === "setup" ? "Configurer le mot de passe" : "Réinitialiser le mot de passe"
                  )}
                </Button>
              </form>
            </Form>
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
