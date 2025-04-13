
import React from "react";
import { Control } from "react-hook-form";
import { MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
import { Mission } from "@/types/types";
import { BasicMissionFields } from "../components/BasicMissionFields";
import { SdrSelector } from "../../form-fields/SdrSelector";
import { ReadOnlySdrDisplay } from "../components/ReadOnlySdrDisplay";

interface FormStepOneProps {
  control: Control<MissionFormValues>;
  isSubmitting: boolean;
  canEditAllFields: boolean;
  mission: Mission | null;
}

export function FormStepOne({
  control,
  isSubmitting,
  canEditAllFields,
  mission
}: FormStepOneProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Informations générales</h3>
      
      <BasicMissionFields
        control={control}
        isSubmitting={isSubmitting}
      />
      
      {canEditAllFields && (
        <SdrSelector control={control} disabled={isSubmitting} />
      )}
      
      {!canEditAllFields && (
        <ReadOnlySdrDisplay 
          sdrName={mission?.sdrName || "Non assigné"} 
          sdrId={mission?.sdrId}
        />
      )}
    </div>
  );
}
