
import React from "react";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { MissionStatus } from "@/types/types";
import { Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadOnlyStatusDisplayProps {
  status: MissionStatus;
}

export function ReadOnlyStatusDisplay({ status }: ReadOnlyStatusDisplayProps) {
  return (
    <FormItem>
      <FormLabel>Statut de la mission</FormLabel>
      <div className="flex items-center h-10 px-3 rounded-md border border-input bg-background">
        <Badge
          className={cn(
            "font-normal",
            status === "En cours" && "bg-blue-100 text-blue-800",
            status === "Terminé" && "bg-green-100 text-green-800"
          )}
        >
          {status === "En cours" && (
            <>
              <Clock className="mr-2 h-4 w-4" />
              En cours
            </>
          )}
          {status === "Terminé" && (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Terminé
            </>
          )}
        </Badge>
      </div>
    </FormItem>
  );
}
