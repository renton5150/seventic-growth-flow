
import React, { useState } from "react";
import { WorkScheduleView } from "./WorkScheduleView";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";

export const WorkScheduleTransition = () => {
  const [showNewSystem, setShowNewSystem] = useState(true);

  return (
    <div className="space-y-4">
      {/* Message d'information sur le nouveau système */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Nouveau système de télétravail activé</h3>
            <p className="text-sm text-green-700 mt-1">
              Le nouveau système utilise une base de données propre avec des contraintes strictes pour éliminer 
              définitivement les problèmes de données fantômes. Toutes vos données ont été migrées en sécurité.
            </p>
            <div className="mt-2 text-xs text-green-600">
              ✅ Protection contre les doublons • ✅ Suppression fiable • ✅ Cache optimisé
            </div>
          </div>
        </div>
      </div>

      {/* Composant principal */}
      <WorkScheduleView />
    </div>
  );
};
