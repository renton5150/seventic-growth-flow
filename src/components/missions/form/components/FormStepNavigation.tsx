
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, X } from "lucide-react";
import { motion } from "framer-motion";

interface FormStepNavigationProps {
  currentStep: number;
  onNext?: () => void;
  onPrev?: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  canGoNext?: boolean;
  isNextDisabled?: boolean;
  isEditMode?: boolean;
}

export function FormStepNavigation({
  currentStep,
  onNext,
  onPrev,
  onCancel,
  isSubmitting = false,
  canGoNext = true,
  isNextDisabled = false,
  isEditMode = false
}: FormStepNavigationProps) {
  return (
    <div className={`flex ${currentStep === 0 ? 'justify-end' : 'justify-between'} space-x-2 pt-4`}>
      {currentStep > 0 && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onPrev}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      )}
      
      {currentStep === 0 && (
        <Button 
          type="button" 
          onClick={onNext} 
          disabled={!canGoNext || isNextDisabled || isSubmitting}
          className="transition-all"
        >
          Suivant
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
      
      {currentStep > 0 && (
        <div className="flex space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="relative overflow-hidden"
          >
            {isSubmitting ? (
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center"
              >
                <span className="mr-2">⏳</span>
                <span>{isEditMode ? "Mise à jour..." : "Création..."}</span>
              </motion.span>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                <span>{isEditMode ? "Mettre à jour" : "Créer"}</span>
              </>
            )}
            
            {isSubmitting && (
              <span className="absolute inset-0 bg-white/20 animate-pulse rounded"></span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
