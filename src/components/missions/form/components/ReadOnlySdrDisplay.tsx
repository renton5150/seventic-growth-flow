
import React from "react";
import { FormItem, FormLabel } from "@/components/ui/form";
import { User } from "lucide-react";

interface ReadOnlySdrDisplayProps {
  sdrName: string;
  sdrId?: string;
}

export function ReadOnlySdrDisplay({ sdrName, sdrId }: ReadOnlySdrDisplayProps) {
  return (
    <FormItem>
      <FormLabel className="flex items-center">
        <User className="mr-2 h-4 w-4" />
        SDR assigné
      </FormLabel>
      <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted">
        <User className="mr-2 h-4 w-4 text-muted-foreground" />
        <span>{sdrName}</span>
        {sdrId && <span className="text-xs text-muted-foreground ml-2">({sdrId.slice(0, 8)}...)</span>}
      </div>
    </FormItem>
  );
}
