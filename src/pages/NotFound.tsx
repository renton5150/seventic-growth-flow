
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-seventic-100 to-seventic-200 p-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-7xl font-bold text-seventic-500">404</h1>
        <p className="mt-4 text-xl text-seventic-900">Page non trouvée</p>
        <p className="mt-2 text-seventic-600">La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <div className="flex gap-2 mt-8 justify-center">
          <Button 
            className="bg-seventic-500 hover:bg-seventic-600" 
            onClick={() => navigate("/dashboard")}
          >
            Retourner au tableau de bord
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
          >
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
