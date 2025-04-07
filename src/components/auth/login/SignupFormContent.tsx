
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, Lock, UserPlus, Loader2, Shield } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { FormField } from "./FormField";

// Signup form schema with validation
const signupSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupFormContentProps {
  onSubmit: (email: string, password: string, name: string) => Promise<boolean>;
  isOffline: boolean;
  isAdminSignup?: boolean;
  onToggleAdminSignup?: () => void;
  isSubmitting?: boolean;
}

export const SignupFormContent = ({ 
  onSubmit, 
  isOffline, 
  isAdminSignup = false,
  onToggleAdminSignup,
  isSubmitting = false
}: SignupFormContentProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleSubmit = async (values: SignupFormValues) => {
    setInternalSubmitting(true);
    
    try {
      await onSubmit(values.email, values.password, values.name);
    } finally {
      setInternalSubmitting(false);
    }
  };
  
  const effectiveIsSubmitting = isSubmitting || internalSubmitting;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          label="Nom"
          placeholder="Votre nom"
          icon={<UserPlus className="h-4 w-4" />}
          disabled={effectiveIsSubmitting || isOffline}
          autoComplete="name"
        />
        
        <FormField
          control={form.control}
          name="email"
          label="Email"
          placeholder="email@example.com"
          type="email"
          icon={<Mail className="h-4 w-4" />}
          disabled={effectiveIsSubmitting || isOffline}
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
          disabled={effectiveIsSubmitting || isOffline}
          autoComplete="new-password"
        />
        
        {/* Option administrateur */}
        {onToggleAdminSignup && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="admin"
              checked={isAdminSignup}
              onCheckedChange={onToggleAdminSignup}
              disabled={effectiveIsSubmitting || isOffline}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="admin"
                className="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <Shield className="h-3 w-3 mr-1 text-seventic-500" /> 
                Créer un compte administrateur
              </Label>
            </div>
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full bg-seventic-500 hover:bg-seventic-600" 
          disabled={effectiveIsSubmitting || isOffline}
        >
          {effectiveIsSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Inscription en cours...
            </>
          ) : isOffline ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Vérification de la connexion...
            </>
          ) : (
            isAdminSignup ? "S'inscrire en tant qu'admin" : "S'inscrire"
          )}
        </Button>
      </form>
    </Form>
  );
};
