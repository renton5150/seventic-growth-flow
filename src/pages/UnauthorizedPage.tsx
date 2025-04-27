
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-seventic-100 to-seventic-200 p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="flex justify-center">
          <Lock size={80} className="text-seventic-500" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-seventic-900">Accès non autorisé</h1>
        <p className="mt-2 text-seventic-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <Button 
          className="mt-8 bg-seventic-500 hover:bg-seventic-600" 
          onClick={() => navigate("/dashboard")}
        >
          Retourner au tableau de bord
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
