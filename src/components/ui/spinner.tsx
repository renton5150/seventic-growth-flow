
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: string | number;
}

export const Spinner = ({ className, size = "24px", ...props }: SpinnerProps) => {
  // Convert size to pixels if it's a number
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-t-transparent", className)}
      style={{ 
        borderTopColor: "transparent", 
        borderWidth: "2px",
        width: sizeValue,
        height: sizeValue
      }}
      {...props}
    ></div>
  );
};
