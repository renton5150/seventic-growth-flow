
import { Mission } from "@/types/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface MissionInfoSectionProps {
  mission: Mission;
}

export const MissionInfoSection = ({ mission }: MissionInfoSectionProps) => {
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "d MMMM yyyy", { locale: fr });
  };

  return (
    <div className="space-y-6">
      {/* Section informations générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            SDR responsable
          </h3>
          <p>{mission.sdrName || "Non assigné"}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Date de création
          </h3>
          <p>{formatDate(mission.createdAt)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Date de démarrage
          </h3>
          <p>{formatDate(mission.startDate)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Date de fin
          </h3>
          <p>{formatDate(mission.endDate)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Type de mission
          </h3>
          <p>{mission.type}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Statut
          </h3>
          <p>{mission.status}</p>
        </div>
      </div>

      {/* Section description */}
      {mission.description && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Description
          </h3>
          <p className="text-sm whitespace-pre-wrap">{mission.description}</p>
        </div>
      )}

      {/* Section objectifs et prestations */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Objectifs et prestations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mission.objectifMensuelRdv && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Objectif mensuel RDV
              </h3>
              <p>{mission.objectifMensuelRdv}</p>
            </div>
          )}
          
          {mission.typesPrestation && mission.typesPrestation.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Types de prestation vendus
              </h3>
              <div className="flex flex-wrap gap-2">
                {mission.typesPrestation.map((prestation, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {prestation}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section qualification et cibles */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Qualification et cibles</h2>
        <div className="space-y-4">
          {mission.criteresQualification && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Critères de qualification
              </h3>
              <p className="text-sm whitespace-pre-wrap">{mission.criteresQualification}</p>
            </div>
          )}
          
          {mission.interlocuteursCibles && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Interlocuteurs cibles
              </h3>
              <p className="text-sm whitespace-pre-wrap">{mission.interlocuteursCibles}</p>
            </div>
          )}
        </div>
      </div>

      {/* Section connexion */}
      {mission.loginConnexion && (
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Informations de connexion</h2>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Login de connexion
            </h3>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded border">
              {mission.loginConnexion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
