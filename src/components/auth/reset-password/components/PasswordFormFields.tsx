
import React from "react";
import { FormField } from "@/components/auth/login/FormField";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound } from "lucide-react";
import { Form } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { PasswordFormValues } from "../hooks/usePasswordForm";
import { RedirectToForgotButton } from "./RedirectToForgotButton";
import { RequestNewLinkButton } from "./RequestNewLinkButton";

interface PasswordFormFieldsProps {
  form: UseFormReturn<PasswordFormValues>;
  isSubmitting: boolean;
  hasValidSession: boolean;
  mode: "reset" | "setup";
  isRequestingNewLink: boolean;
  email: string;
  onSubmit: (values: PasswordFormValues) => void;
  onRequestNewLink: () => void;
}

export const PasswordFormFields: React.FC<PasswordFormFieldsProps> = ({
  form,
  isSubmitting,
  hasValidSession,
  mode,
  isRequestingNewLink,
  email,
  onSubmit,
  onRequestNewLink
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          label="Nouveau mot de passe"
          isPassword
          showPassword={false}
          onTogglePassword={() => {}}
          icon={<KeyRound className="h-4 w-4" />}
          disabled={isSubmitting || !hasValidSession}
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
          disabled={isSubmitting || !hasValidSession}
          autoComplete="new-password"
        />
        
        <Button 
          type="submit" 
          className="w-full bg-seventic-500 hover:bg-seventic-600" 
          disabled={isSubmitting || !hasValidSession}
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

        {!hasValidSession && <RedirectToForgotButton />}

        {hasValidSession && (
          <RequestNewLinkButton 
            isRequestingNewLink={isRequestingNewLink}
            hasEmail={!!email}
            onClick={onRequestNewLink}
          />
        )}
      </form>
    </Form>
  );
};
