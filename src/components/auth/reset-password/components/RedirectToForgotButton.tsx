
import React from "react";
import { Button } from "@/components/ui/button";

export const RedirectToForgotButton: React.FC = () => {
  return (
    <div className="mt-4 text-center">
      <Button
        type="button"
        variant="outline"
        onClick={() => window.location.href = "/forgot-password"}
        className="w-full"
      >
        Demander un nouveau lien de réinitialisation
      </Button>
    </div>
  );
};
