
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DataUnavailableAlertProps {
  message?: string;
}

export const DataUnavailableAlert = ({ message }: DataUnavailableAlertProps) => {
  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <AlertDescription>
        {message || "Certaines données sont temporairement indisponibles"}
      </AlertDescription>
    </Alert>
  );
};
