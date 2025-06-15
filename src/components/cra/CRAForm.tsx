import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  sdrId?: string;
  readOnly?: boolean;
}

interface Mission {
  id: string;
  name: string;
  client: string;
}

interface MissionTimeWithOpportunity extends DailyMissionTime {
  opportunity_name?: string;
  opportunity_value?: 5 | 10 | 20;
}

export const CRAForm = ({ selectedDate, onDateChange, sdrId, readOnly = false }: CRAFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [missionTimes, setMissionTimes] = useState<MissionTimeWithOpportunity[]>([]);
  const [comments, setComments] = useState<string>("");

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const isWeekendDay = isWeekend(selectedDate);
  const targetSdrId = sdrId || user?.id;

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
    
    if (craData?.missionTimes && craData?.opportunities) {
      // Fusionner les temps de mission avec les opportunités
      const mergedData = craData.missionTimes.map(mt => {
        const opportunity = craData.opportunities.find(opp => opp.mission_id === mt.mission_id);
        return {
          ...mt,
          opportunity_name: opportunity?.opportunity_name || '',
          opportunity_value: opportunity?.opportunity_value || 5
        };
      });
      setMissionTimes(mergedData);
    } else if (craData?.missionTimes) {
      setMissionTimes(craData.missionTimes.map(mt => ({ ...mt, opportunity_name: '', opportunity_value: 5 as 5 | 10 | 20 })));
    } else {
      setMissionTimes([]);
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
    newMissionTimes[index] = { ...newMissionTimes[index], [field]: value };
    setMissionTimes(newMissionTimes);
  };

  const handleOpportunityValueChange = (index: number, value: 5 | 10 | 20, checked: boolean) => {
    if (readOnly) return;
    const newMissionTimes = [...missionTimes];
    if (checked) {
      newMissionTimes[index] = { 
        ...newMissionTimes[index], 
        opportunity_value: value,
        opportunity_name: newMissionTimes[index].opportunity_name || ''
      };
    } else {
      // Si on décoche, on remet à 5 par défaut
      newMissionTimes[index] = { 
        ...newMissionTimes[index], 
        opportunity_value: 5,
        opportunity_name: ''
      };
    }
    setMissionTimes(newMissionTimes);
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
      opportunity_name: '',
      opportunity_value: 5,
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
      opportunities: missionTimes
        .filter(mt => mt.opportunity_name && mt.opportunity_name.trim() !== '')
        .map(mt => ({
          mission_id: mt.mission_id,
          opportunity_name: mt.opportunity_name!,
          opportunity_value: mt.opportunity_value!
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
          <CardTitle>Répartition du temps par mission et opportunités</CardTitle>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission</TableHead>
                <TableHead className="text-center">Temps passé (%)</TableHead>
                <TableHead className="text-center">5%</TableHead>
                <TableHead className="text-center">10%</TableHead>
                <TableHead className="text-center">20%</TableHead>
                <TableHead>Activités</TableHead>
                {!readOnly && <TableHead className="text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {missionTimes.map((missionTime, index) => {
                const mission = missions?.find(m => m.id === missionTime.mission_id);
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <select
                        value={missionTime.mission_id}
                        onChange={(e) => !readOnly && handleMissionTimeChange(index, 'mission_id', e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        disabled={readOnly}
                      >
                        {missions?.map(mission => (
                          <option key={mission.id} value={mission.id}>
                            {mission.name} ({mission.client})
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={missionTime.time_percentage}
                        onChange={(e) => !readOnly && handleMissionTimeChange(index, 'time_percentage', parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                        readOnly={readOnly}
                        disabled={readOnly}
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={missionTime.opportunity_value === 5 && missionTime.opportunity_name !== ''}
                        onChange={(e) => !readOnly && handleOpportunityValueChange(index, 5, e.target.checked)}
                        disabled={readOnly}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={missionTime.opportunity_value === 10}
                        onChange={(e) => !readOnly && handleOpportunityValueChange(index, 10, e.target.checked)}
                        disabled={readOnly}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={missionTime.opportunity_value === 20}
                        onChange={(e) => !readOnly && handleOpportunityValueChange(index, 20, e.target.checked)}
                        disabled={readOnly}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Input
                        value={missionTime.opportunity_name || ''}
                        onChange={(e) => !readOnly && handleMissionTimeChange(index, 'opportunity_name', e.target.value)}
                        placeholder="Nom de l'activité/opportunité"
                        readOnly={readOnly}
                        disabled={readOnly}
                        className="text-sm"
                      />
                    </TableCell>
                    
                    {!readOnly && (
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveMissionTime(index)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddMissionTime}
              className="mt-4 w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une mission
            </Button>
          )}
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
