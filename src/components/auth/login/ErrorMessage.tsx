
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorMessageProps {
  error: string | null;
}

export const ErrorMessage = ({ error }: ErrorMessageProps) => {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};
