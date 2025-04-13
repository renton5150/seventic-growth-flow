
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormButtonsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

export function FormButtons({
  isSubmitting,
  onCancel,
  submitLabel = "Mettre à jour",
  cancelLabel = "Annuler",
}: FormButtonsProps) {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submitLabel === "Mettre à jour" ? "Mise à jour..." : "Création..."}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}
