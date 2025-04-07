
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { FormField } from "./FormField";
import { toast } from "sonner";

// Login form schema with validation
const loginSchema = z.object({
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormContentProps {
  onSubmit: (email: string, password: string) => Promise<boolean>;
  isOffline: boolean;
}

export const LoginFormContent = ({ onSubmit, isOffline }: LoginFormContentProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Tentative de connexion:", values.email);
      
      const result = await onSubmit(values.email, values.password);
      
      if (!result) {
        console.log("Échec de la connexion");
        // Toast déjà affiché par la fonction login
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      toast.error("Erreur inattendue", {
        description: "Veuillez réessayer ou actualiser la page"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          label="Email"
          placeholder="email@example.com"
          type="email"
          icon={<Mail className="h-4 w-4" />}
          disabled={isSubmitting || isOffline}
          autoComplete="email"
        />
        
        <FormField
          control={form.control}
          name="password"
          label="Mot de passe"
          isPassword
          showPassword={showPassword}
          onTogglePassword={toggleShowPassword}
          icon={<Lock className="h-4 w-4" />}
          disabled={isSubmitting || isOffline}
          autoComplete="current-password"
        />
        
        <Button 
          type="submit" 
          className="w-full bg-seventic-500 hover:bg-seventic-600" 
          disabled={isSubmitting || isOffline}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Connexion en cours...
            </>
          ) : isOffline ? (
            "Serveur non disponible"
          ) : (
            "Se connecter"
          )}
        </Button>

        {isSubmitting && (
          <div className="text-sm text-center text-muted-foreground mt-2">
            <p>La connexion prend du temps?{" "} 
              <button 
                type="button" 
                onClick={() => window.location.reload()} 
                className="text-seventic-500 hover:underline ml-1">
                Actualiser la page
              </button>
            </p>
          </div>
        )}
      </form>
    </Form>
  );
};
