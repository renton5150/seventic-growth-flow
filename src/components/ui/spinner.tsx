
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Spinner = ({ className, ...props }: SpinnerProps) => {
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-t-transparent", className)}
      style={{ borderTopColor: "transparent", borderWidth: "2px" }}
      {...props}
    ></div>
  );
};
