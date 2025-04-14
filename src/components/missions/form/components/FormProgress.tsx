
import React from "react";
import { Progress } from "@/components/ui/progress";

interface FormProgressProps {
  currentStep: number;
  progressPercentage: number;
}

export function FormProgress({ currentStep, progressPercentage }: FormProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Étape {currentStep + 1} sur 2</span>
        <span>{progressPercentage}% complété</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
