
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DemoAlertProps {
  showDemoMode?: boolean;
}

export const DemoAlert = ({ showDemoMode = false }: DemoAlertProps) => {
  // If demo mode is disabled, don't render anything
  if (!showDemoMode) return null;
  
  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-700">Mode démonstration</AlertTitle>
      <AlertDescription className="text-blue-600">
        Pour tester l'application, créez un compte avec votre propre email et mot de passe.
      </AlertDescription>
    </Alert>
  );
};
