
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, Mail, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

// Schéma de validation pour le formulaire
const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Obtenir l'URL complète pour être sûr d'avoir le bon domaine
      const origin = window.location.origin;
      const redirectUrl = `${origin}/reset-password`;

      console.log("Envoi d'un lien de réinitialisation à:", values.email);
      console.log("URL de redirection:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error);
        setError(error.message);
      } else {
        setIsSuccess(true);
        toast.success("Email de réinitialisation envoyé", {
          description: "Veuillez vérifier votre boîte de réception"
        });
      }
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
            Mot de passe oublié
          </CardTitle>
          <CardDescription className="text-center">
            Entrez votre email pour recevoir un lien de réinitialisation
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
            <div className="text-center py-4">
              <div className="mx-auto bg-blue-100 text-blue-800 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">
                Vérifiez votre email
              </h3>
              <p className="text-gray-600 mb-4">
                Nous avons envoyé un email de réinitialisation de mot de passe à <span className="font-medium">{form.getValues().email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Si vous ne recevez pas d'email dans les prochaines minutes, vérifiez votre dossier de spam.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  label="Email"
                  placeholder="email@example.com"
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-seventic-500 hover:bg-seventic-600" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien de réinitialisation"
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

export default ForgotPassword;
