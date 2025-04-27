
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Simple hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup event listener
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  return isMobile;
};

export default function MobileFeedback() {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <Alert className="border-orange-500 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <AlertTitle className="text-orange-800">Pour une meilleure expérience</AlertTitle>
        <AlertDescription className="text-orange-700">
          Cette application est optimisée pour les ordinateurs de bureau. Certaines fonctionnalités pourraient être limitées sur mobile.
        </AlertDescription>
      </Alert>
    </div>
  );
}
