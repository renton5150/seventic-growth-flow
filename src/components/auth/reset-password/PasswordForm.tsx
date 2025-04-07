
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField } from "@/components/auth/login/FormField";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

interface PasswordFormProps {
  mode: "reset" | "setup";
  onSuccess: () => void;
  onError: (message: string) => void;
}

export const PasswordForm = ({ mode, onSuccess, onError }: PasswordFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: PasswordFormValues) => {
    setIsSubmitting(true);

    try {
      console.log(`Tentative de ${mode === 'setup' ? 'configuration' : 'réinitialisation'} du mot de passe`);
      
      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        console.error("Erreur lors de la mise à jour du mot de passe:", error);
        onError(error.message);
        return;
      }

      // Succès
      console.log("Mot de passe mis à jour avec succès");
      toast.success(mode === "setup" ? 
        "Mot de passe défini avec succès" : 
        "Mot de passe réinitialisé avec succès");
      
      onSuccess();
      
      // Rediriger vers la page de connexion après quelques secondes
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Erreur inattendue:", error);
      onError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
};
