
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getRequestDetails } from "@/services/requests/requestQueryService";
import { Request } from "@/types/types";

export const useRequestDetails = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      // Ne pas essayer de récupérer les détails si l'ID est "new" - c'est pour la création
      if (!requestId || requestId === "new" || !user) {
        setLoading(false);
        return;
      }

      // Vérifier que l'ID est un UUID valide avant de faire la requête
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(requestId)) {
        console.warn(`[useRequestDetails] ID invalide: ${requestId}`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`[useRequestDetails] Récupération des détails pour: ${requestId}`);
        
        const isSDR = user.role === 'sdr';
        const details = await getRequestDetails(requestId, user.id, isSDR);
        
        if (details) {
          setRequest(details);
          console.log(`[useRequestDetails] Détails récupérés:`, details);
        } else {
          setError("Demande non trouvée");
          console.warn(`[useRequestDetails] Aucun détail trouvé pour: ${requestId}`);
        }
      } catch (err) {
        console.error(`[useRequestDetails] Erreur lors de la récupération:`, err);
        setError("Erreur lors de la récupération des détails de la demande");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, user]);

  return { request, loading, error, refetch: () => window.location.reload() };
};
