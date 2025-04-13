
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCcw, SaveAll } from "lucide-react";
import { motion } from "framer-motion";

interface DraftAlertProps {
  onRestore: () => void;
  onIgnore: () => void;
}

export function DraftAlert({ onRestore, onIgnore }: DraftAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <RefreshCcw className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Brouillon disponible</AlertTitle>
        <AlertDescription className="flex flex-col space-y-2 text-blue-700">
          <p>Un brouillon sauvegardé est disponible pour ce formulaire.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button size="sm" variant="default" onClick={onRestore} className="bg-blue-600 hover:bg-blue-700">
              <SaveAll className="mr-2 h-4 w-4" />
              Restaurer le brouillon
            </Button>
            <Button size="sm" variant="outline" onClick={onIgnore} className="text-blue-600 border-blue-300 hover:bg-blue-100">
              Ignorer
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
