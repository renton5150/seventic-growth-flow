import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRequestById } from "@/services/requestService";
import { getMissionById } from "@/services/missionService";
import { Request, Mission } from "@/types/types";
import { toast } from "sonner";

const RequestDetails = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (id) {
        try {
          setLoading(true);
          const fetchedRequest = await getRequestById(id);
          if (fetchedRequest) {
            setRequest(fetchedRequest);
            
            // Récupérer les détails de la mission associée
            if (fetchedRequest.missionId) {
              const fetchedMission = await getMissionById(fetchedRequest.missionId);
              setMission(fetchedMission || null);
            }
          } else {
            toast.error("La demande n'existe pas ou a été supprimée");
            navigate(-1);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des détails de la demande:", error);
          toast.error("Erreur lors de la récupération des détails de la demande");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRequestDetails();
  }, [id, navigate]);

  const renderTypeSpecificDetails = () => {
    if (!request) return null;

    switch (request.type) {
      case "email":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Détails de la campagne email</h3>
            {/* Mettre ici les détails spécifiques aux campagnes email */}
          </div>
        );
      case "database":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Détails de la création de base de données</h3>
            {/* Mettre ici les détails spécifiques aux bases de données */}
          </div>
        );
      case "linkedin":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Détails du scraping LinkedIn</h3>
            {/* Mettre ici les détails spécifiques au scraping LinkedIn */}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Chargement des détails de la demande...</p>
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Cette demande n'existe pas</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{request.title}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Détails de la demande</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {request.type === "email"
                      ? "Campagne Email"
                      : request.type === "database"
                      ? "Création de base de données"
                      : "Scraping LinkedIn"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className="font-medium">{request.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de création</p>
                  <p className="font-medium">{new Date(request.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date d'échéance</p>
                  <p className="font-medium">{new Date(request.dueDate).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mission</p>
                  <p className="font-medium">{mission?.name || "Inconnue"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{mission?.client || "Inconnu"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              {renderTypeSpecificDetails()}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Suivi</h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                <p className="font-medium">{new Date(request.lastUpdated).toLocaleDateString("fr-FR")}</p>
                <p className="text-sm text-muted-foreground">Créée par</p>
                <p className="font-medium">{request.sdrName || "Inconnu"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RequestDetails;
