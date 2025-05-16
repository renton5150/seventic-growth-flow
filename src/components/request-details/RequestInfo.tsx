
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users, Check, AlertCircle } from "lucide-react";
import { Request } from '@/types/types';
import { Mission } from '@/types/types';
import { getMissionName } from '@/services/missionNameService';

interface RequestInfoProps {
  request: Request;
  mission: Mission | null;
}

export const RequestInfo = ({ request, mission }: RequestInfoProps) => {
  // État local pour stocker le nom de mission si on doit le récupérer dynamiquement
  const [resolvedMissionName, setResolvedMissionName] = useState<string | null>(null);

  // Si l'objet mission est null mais qu'on a un missionId, on récupère le nom
  useEffect(() => {
    const resolveMissionName = async () => {
      if (!mission && request.missionId) {
        try {
          const name = await getMissionName(request.missionId);
          console.log(`[RequestInfo] Resolved mission name for ${request.missionId}: ${name}`);
          setResolvedMissionName(name);
        } catch (err) {
          console.error('[RequestInfo] Error resolving mission name:', err);
          setResolvedMissionName('Mission sans nom');
        }
      }
    };

    resolveMissionName();
  }, [mission, request.missionId]);

  // Déterminer le nom de mission à afficher
  const displayMissionName = mission?.name || resolvedMissionName || request.missionName || 'Mission sans nom';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Créée le</div>
              <div>{new Date(request.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Date d'échéance</div>
              <div>{new Date(request.dueDate).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Dernière mise à jour</div>
              <div>{new Date(request.lastUpdated).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Créée par</div>
              <div>{request.sdrName || "Inconnu"}</div>
            </div>
          </div>

          {request.assignedToName && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm text-gray-500">Assignée à</div>
                <div>{request.assignedToName}</div>
              </div>
            </div>
          )}
          
          {request.isLate && (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <div>En retard</div>
            </div>
          )}
        </>
        
        {/* Section mission toujours visible avec le nom résolu */}
        <div className="pt-2 border-t">
          <h3 className="font-medium mb-1">Mission</h3>
          <p>{displayMissionName}</p>
          {mission?.description && (
            <p className="text-sm text-gray-500 mt-1">{mission.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
