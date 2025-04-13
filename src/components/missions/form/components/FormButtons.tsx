
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X } from "lucide-react";
import { motion } from "framer-motion";

interface FormButtonsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  showSaveIcon?: boolean;
}

export function FormButtons({
  isSubmitting,
  onCancel,
  submitLabel = "Mettre à jour",
  cancelLabel = "Annuler",
  showSaveIcon = true,
}: FormButtonsProps) {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
      >
        <X className="mr-2 h-4 w-4" />
        {cancelLabel}
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="relative overflow-hidden"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>{submitLabel === "Mettre à jour" ? "Mise à jour..." : "Création..."}</span>
          </>
        ) : (
          <>
            {showSaveIcon && <Save className="mr-2 h-4 w-4" />}
            <span>{submitLabel}</span>
          </>
        )}
        
        {/* Animation du bouton lors du clic */}
        {isSubmitting && (
          <span className="absolute inset-0 bg-white/20 animate-pulse rounded"></span>
        )}
      </Button>
    </div>
  );
}
