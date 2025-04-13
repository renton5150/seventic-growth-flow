
import React from "react";
import { Control, UseFormReturn } from "react-hook-form";
import { MissionFormValues } from "@/components/missions/schemas/missionFormSchema";
import { Mission } from "@/types/types";
import { DateField } from "../../form-fields/DateField";
import { MissionTypeSelector } from "../../form-fields/MissionTypeSelector";
import { StatusSelector } from "../components/StatusSelector";
import { ReadOnlyStatusDisplay } from "../components/ReadOnlyStatusDisplay";

interface FormStepTwoProps {
  control: Control<MissionFormValues>;
  isSubmitting: boolean;
  canEditAllFields: boolean;
  canChangeStatus: boolean;
  isEditMode: boolean;
  mission: Mission | null;
  form: UseFormReturn<MissionFormValues>;
}

export function FormStepTwo({
  control,
  isSubmitting,
  canEditAllFields,
  canChangeStatus,
  isEditMode,
  mission,
  form
}: FormStepTwoProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Dates et type</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateField
          control={control}
          name="startDate"
          label="Date de début"
          disabled={isSubmitting}
        />
        <DateField
          control={control}
          name="endDate"
          label="Date de fin (optionnelle)"
          disabled={isSubmitting}
          minDate={form.watch('startDate') || undefined}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MissionTypeSelector
          control={control}
          disabled={isSubmitting || !canEditAllFields}
        />
        
        {isEditMode ? (
          canChangeStatus ? (
            <StatusSelector 
              control={control} 
              disabled={isSubmitting}
            />
          ) : (
            <ReadOnlyStatusDisplay status={mission?.status || "En cours"} />
          )
        ) : null}
      </div>
    </div>
  );
}
