
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | string;
}

export function Spinner({ className, size, ...props }: SpinnerProps) {
  // Map size prop to appropriate Tailwind classes
  const sizeClass = () => {
    if (!size) return "h-4 w-4";
    
    // Handle predefined sizes
    switch (size) {
      case "sm": return "h-3 w-3";
      case "md": return "h-6 w-6";
      case "lg": return "h-8 w-8";
      default:
        // For direct size values like "8" or custom classes, use as is
        return `h-${size} w-${size}`;
    }
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClass(),
        className
      )}
      {...props}
    >
      <span className="sr-only">Chargement</span>
    </div>
  );
}
