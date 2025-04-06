
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DemoAlertProps {
  showDemoMode?: boolean;
}

export const DemoAlert = ({ showDemoMode = false }: DemoAlertProps) => {
  // Always return null to ensure demo mode is never displayed
  return null;
};
