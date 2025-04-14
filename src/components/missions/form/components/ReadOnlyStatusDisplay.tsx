
import React from "react";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReadOnlyStatusDisplayProps {
  status: string;
}

export function ReadOnlyStatusDisplay({ status }: ReadOnlyStatusDisplayProps) {
  return (
    <FormItem>
      <FormLabel>Statut de la mission</FormLabel>
      <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted">
        <Badge 
          className={cn(
            "font-normal",
            status === "En cours" && "bg-blue-100 text-blue-800",
            status === "Terminé" && "bg-green-100 text-green-800"
          )}
        >
          {status}
        </Badge>
      </div>
    </FormItem>
  );
}
