
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const GrowthNavigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Les profils Growth, SDR et Admin peuvent créer de nouvelles demandes
  const canCreateRequests = user?.role === 'growth' || user?.role === 'sdr' || user?.role === 'admin';

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Growth</h1>
        <p className="mt-2 text-gray-500">
          Gérez et assignez les demandes de l'équipe
        </p>
      </div>
      
      {/* Bouton "Nouvelle demande" pour Growth, SDR et Admin */}
      {canCreateRequests && (
        <div className="relative">
          <select
            className="appearance-none bg-purple-600 text-white px-4 py-2 pr-10 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
            onChange={(e) => {
              if (e.target.value) {
                navigate(e.target.value);
                e.target.value = "";
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>
              <Plus className="inline w-4 h-4 mr-1" />
              Nouvelle demande
            </option>
            <option value="/requests/email-campaign">Campagne Email</option>
            <option value="/requests/database-creation">Base de données</option>
            <option value="/requests/linkedin-scraping">Scraping LinkedIn</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <Plus className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};
