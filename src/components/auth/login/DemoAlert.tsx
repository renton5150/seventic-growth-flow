
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DemoAlertProps {
  showDemoMode?: boolean;
}

export const DemoAlert = ({ showDemoMode = false }: DemoAlertProps) => {
  // Ne rien afficher - mode démonstration désactivé
  return null;
};
