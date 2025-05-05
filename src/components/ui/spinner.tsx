
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: string;
}

export function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        size ? `h-${size} w-${size}` : "h-4 w-4", 
        className
      )}
      {...props}
    >
      <span className="sr-only">Chargement</span>
    </div>
  );
}
