
import { useState } from "react";
import { usePasswordForm, PasswordFormValues } from "./hooks/usePasswordForm";
import { PasswordFormFields } from "./components/PasswordFormFields";
import { LoadingState } from "./components/LoadingState";

interface PasswordFormProps {
  mode: "reset" | "setup";
  onSuccess: () => void;
  onError: (message: string) => void;
}

export const PasswordForm = ({ mode, onSuccess, onError }: PasswordFormProps) => {
  const {
    form,
    isSubmitting,
    sessionChecked,
    hasValidSession,
    isRequestingNewLink,
    email,
    handleSubmit,
    handleRequestNewLink
  } = usePasswordForm({
    mode,
    onSuccess,
    onError
  });

  // Afficher un indicateur de chargement pendant la vérification de session
  if (!sessionChecked) {
    return <LoadingState />;
  }

  return (
    <PasswordFormFields
      form={form}
      isSubmitting={isSubmitting}
      hasValidSession={hasValidSession}
      mode={mode}
      isRequestingNewLink={isRequestingNewLink}
      email={email}
      onSubmit={handleSubmit}
      onRequestNewLink={handleRequestNewLink}
    />
  );
};
