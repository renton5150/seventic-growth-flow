
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DataUnavailableAlertProps {
  message?: string;
}

export const DataUnavailableAlert = ({ message }: DataUnavailableAlertProps) => {
  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {message || "Certaines données sont temporairement indisponibles"}
      </AlertDescription>
    </Alert>
  );
};
