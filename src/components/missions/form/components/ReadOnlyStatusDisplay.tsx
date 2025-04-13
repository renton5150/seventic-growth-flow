
import React from "react";
import { FormItem, FormLabel } from "@/components/ui/form";
import { MissionStatus } from "@/types/types";
import { Badge } from "@/components/ui/badge";

interface ReadOnlyStatusDisplayProps {
  status: MissionStatus;
}

export function ReadOnlyStatusDisplay({ status }: ReadOnlyStatusDisplayProps) {
  return (
    <FormItem>
      <FormLabel>Statut de la mission</FormLabel>
      <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 text-gray-700 flex items-center">
        {status === "Terminé" ? (
          <Badge variant="success" className="bg-green-100 text-green-800 border-green-300 font-medium">
            {status}
          </Badge>
        ) : (
          <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300 font-medium">
            {status}
          </Badge>
        )}
      </div>
    </FormItem>
  );
}
