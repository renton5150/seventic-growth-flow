
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AcelleAdminPanel from "@/components/admin/acelle/AcelleAdminPanel";
import { Alert, AlertDescription } from "@/components/ui/alert"; 
import { InfoIcon } from "lucide-react"; 

const AcelleEmailCampaigns = () => {
  const { isAdmin } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Campagnes emailing</h1>
        </div>
        
        {isDemoMode && (
          <Alert variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
            <InfoIcon className="h-4 w-4 mr-2" />
            <AlertDescription>
              Mode démonstration activé : certaines données peuvent être temporaires en raison de problèmes de connexion à l'API.
            </AlertDescription>
          </Alert>
        )}
        
        <AcelleAdminPanel onDemoModeChange={setIsDemoMode} />
      </div>
    </AppLayout>
  );
};

export default AcelleEmailCampaigns;
