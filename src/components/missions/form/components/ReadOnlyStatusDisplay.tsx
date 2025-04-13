
import React from "react";
import { FormItem, FormLabel } from "@/components/ui/form";

interface ReadOnlyStatusDisplayProps {
  status: string;
}

export function ReadOnlyStatusDisplay({ status }: ReadOnlyStatusDisplayProps) {
  return (
    <FormItem>
      <FormLabel>Statut de la mission</FormLabel>
      <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 text-gray-700">
        {status}
      </div>
    </FormItem>
  );
}
