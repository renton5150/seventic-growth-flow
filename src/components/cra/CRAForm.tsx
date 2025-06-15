import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { craService } from "@/services/cra/craService";
import { DailyActivityReport, DailyMissionTime, DailyOpportunity } from "@/types/cra.types";
import { useAuth } from "@/contexts/AuthContext";

interface CRAFormProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  sdrId?: string; // ID du SDR pour les admins
  readOnly?: boolean; // Mode lecture seule pour les admins
}

interface Mission {
  id: string;
  name: string;
  client: string;
}

export const CRAForm = ({ selectedDate, onDateChange, sdrId, readOnly = false }: CRAFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [missionTimes, setMissionTimes] = useState<DailyMissionTime[]>([]);
  const [opportunities, setOpportunities] = useState<DailyOpportunity[]>([]);
  const [comments, setComments] = useState<string>("");

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const isWeekendDay = isWeekend(selectedDate);
  const targetSdrId = sdrId || user?.id; // Utiliser sdrId si fourni, sinon l'utilisateur actuel

  // Requête pour récupérer les missions
  const { data: missions, isLoading: isLoadingMissions } = useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('id, name, client')
        .order('name');

      if (error) {
        console.error("Erreur lors de la récupération des missions:", error);
        throw error;
      }

      return data as Mission[];
    }
  });

  // Requête pour récupérer le CRA existant
  const { data: craData, isLoading: isLoadingCRA, refetch: refetchCRA } = useQuery({
    queryKey: ['cra', formattedDate, targetSdrId],
    queryFn: () => craService.getCRAByDate(formattedDate, targetSdrId),
    enabled: !!targetSdrId && !isWeekendDay
  });

  useEffect(() => {
    if (craData?.report) {
      setComments(craData.report.comments || "");
    } else {
      setComments("");
    }
    
    if (craData?.missionTimes) {
      setMissionTimes(craData.missionTimes);
    } else {
      setMissionTimes([]);
    }
    
    if (craData?.opportunities) {
      setOpportunities(craData.opportunities);
    } else {
      setOpportunities([]);
    }
  }, [craData, selectedDate, sdrId]);

  const totalPercentage = missionTimes.reduce((sum, mt) => sum + mt.time_percentage, 0);

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (readOnly) {
        throw new Error("Modification non autorisée en mode consultation");
      }
      return craService.createOrUpdateCRA(data);
    },
    onSuccess: () => {
      toast.success("CRA sauvegardé avec succès");
      refetchCRA();
      queryClient.invalidateQueries({ queryKey: ['cra', formattedDate, targetSdrId] });
    },
    onError: (error: any) => {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const handleMissionTimeChange = (index: number, field: string, value: any) => {
    if (readOnly) return;
    const newMissionTimes = [...missionTimes];
    newMissionTimes[index][field] = value;
    setMissionTimes(newMissionTimes);
  };

  const handleOpportunityChange = (index: number, field: string, value: any) => {
    if (readOnly) return;
    const newOpportunities = [...opportunities];
    newOpportunities[index][field] = value;
    setOpportunities(newOpportunities);
  };

  const handleAddMissionTime = () => {
    if (readOnly) return;
    const now = new Date();
    setMissionTimes([...missionTimes, {
      id: new Date().getTime().toString(),
      report_id: '',
      mission_id: missions?.[0]?.id || '',
      time_percentage: 0,
      mission_comment: '',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }]);
  };

  const handleRemoveMissionTime = (index: number) => {
    if (readOnly) return;
    const newMissionTimes = [...missionTimes];
    newMissionTimes.splice(index, 1);
    setMissionTimes(newMissionTimes);
  };

  const handleAddOpportunity = () => {
    if (readOnly) return;
    const now = new Date();
    setOpportunities([...opportunities, {
      id: new Date().getTime().toString(),
      report_id: '',
      mission_id: missions?.[0]?.id || '',
      opportunity_name: '',
      opportunity_value: 5,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }]);
  };

  const handleRemoveOpportunity = (index: number) => {
    if (readOnly) return;
    const newOpportunities = [...opportunities];
    newOpportunities.splice(index, 1);
    setOpportunities(newOpportunities);
  };

  const handleSave = () => {
    if (readOnly) {
      toast.error("Modification non autorisée en mode consultation");
      return;
    }

    const craData = {
      report_date: formattedDate,
      mission_times: missionTimes.map(mt => ({
        mission_id: mt.mission_id,
        time_percentage: mt.time_percentage,
        mission_comment: mt.mission_comment
      })),
      opportunities: opportunities.map(opp => ({
        mission_id: opp.mission_id,
        opportunity_name: opp.opportunity_name,
        opportunity_value: opp.opportunity_value as 5 | 10 | 20
      })),
      comments: comments
    };

    saveMutation.mutate(craData);
  };

  if (isWeekendDay) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Weekend</h3>
            <p>Le CRA n'est pas disponible pour les weekends.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingCRA || isLoadingMissions) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement du CRA...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {readOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Mode consultation</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            Vous consultez le CRA en lecture seule.
          </p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Répartition du temps par mission</CardTitle>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: {totalPercentage}% / 100%
            </div>
            <Badge variant={totalPercentage === 100 ? "default" : totalPercentage > 100 ? "destructive" : "secondary"}>
              {totalPercentage === 100 ? "Complet" : totalPercentage > 100 ? "Dépassement" : "Incomplet"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {missionTimes.map((missionTime, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Mission</Label>
                  <select
                    value={missionTime.mission_id}
                    onChange={(e) => !readOnly && handleMissionTimeChange(index, 'mission_id', e.target.value)}
                    className="w-full p-2 border rounded"
                    disabled={readOnly}
                  >
                    {missions?.map(mission => (
                      <option key={mission.id} value={mission.id}>
                        {mission.name} ({mission.client})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Pourcentage (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={missionTime.time_percentage}
                    onChange={(e) => !readOnly && handleMissionTimeChange(index, 'time_percentage', parseInt(e.target.value) || 0)}
                    readOnly={readOnly}
                    disabled={readOnly}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label>Commentaire (optionnel)</Label>
                  <Input
                    value={missionTime.mission_comment || ''}
                    onChange={(e) => !readOnly && handleMissionTimeChange(index, 'mission_comment', e.target.value)}
                    placeholder="Détails sur le travail effectué..."
                    readOnly={readOnly}
                    disabled={readOnly}
                  />
                </div>
                
                <div className="flex items-end">
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveMissionTime(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddMissionTime}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une mission
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opportunités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunities.map((opportunity, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Mission</Label>
                  <select
                    value={opportunity.mission_id}
                    onChange={(e) => !readOnly && handleOpportunityChange(index, 'mission_id', e.target.value)}
                    className="w-full p-2 border rounded"
                    disabled={readOnly}
                  >
                    {missions?.map(mission => (
                      <option key={mission.id} value={mission.id}>
                        {mission.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Nom de l'opportunité</Label>
                  <Input
                    type="text"
                    value={opportunity.opportunity_name}
                    onChange={(e) => !readOnly && handleOpportunityChange(index, 'opportunity_name', e.target.value)}
                    readOnly={readOnly}
                    disabled={readOnly}
                  />
                </div>
                
                <div>
                  <Label>Valeur</Label>
                  <select
                    value={opportunity.opportunity_value}
                    onChange={(e) => !readOnly && handleOpportunityChange(index, 'opportunity_value', e.target.value)}
                    className="w-full p-2 border rounded"
                    disabled={readOnly}
                  >
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                    <option value={20}>20%</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveOpportunity(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddOpportunity}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une opportunité
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commentaires généraux</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={comments}
            onChange={(e) => !readOnly && setComments(e.target.value)}
            placeholder="Commentaires sur la journée, difficultés rencontrées, points positifs..."
            rows={4}
            readOnly={readOnly}
            disabled={readOnly}
          />
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex justify-end space-x-4">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || totalPercentage > 100}
            className="min-w-32"
          >
            {saveMutation.isPending ? (
              "Sauvegarde..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
