
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface RequestNewLinkButtonProps {
  isRequestingNewLink: boolean;
  hasEmail: boolean;
  onClick: () => void;
}

export const RequestNewLinkButton: React.FC<RequestNewLinkButtonProps> = ({
  isRequestingNewLink,
  hasEmail,
  onClick
}) => {
  return (
    <div className="mt-2 text-center">
      <Button
        type="button"
        variant="link"
        onClick={onClick}
        disabled={isRequestingNewLink || !hasEmail}
        className="text-seventic-500"
      >
        {isRequestingNewLink ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" /> 
            Envoi en cours...
          </>
        ) : (
          "Demander un nouveau lien"
        )}
      </Button>
    </div>
  );
};
