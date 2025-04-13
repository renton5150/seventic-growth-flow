
import React from "react";
import { FormItem, FormLabel } from "@/components/ui/form";

interface ReadOnlySdrDisplayProps {
  sdrName: string;
  sdrId?: string;
}

export function ReadOnlySdrDisplay({ sdrName, sdrId }: ReadOnlySdrDisplayProps) {
  return (
    <FormItem>
      <FormLabel>
        Assigner à (SDR) <span className="text-red-500">*</span>
      </FormLabel>
      <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 text-gray-700">
        {sdrName || "Non assigné"}
      </div>
    </FormItem>
  );
}
