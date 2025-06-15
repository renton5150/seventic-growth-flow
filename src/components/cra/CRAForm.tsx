
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

interface MissionTimeWithOpportunities extends DailyMissionTime {
  opportunities_5?: string;
  opportunities_10?: string;
  opportunities_20?: string;
  activity?: string;
}

export const CRAForm = ({ selectedDate, onDateChange, sdrId, readOnly = false }: CRAFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [missionTimes, setMissionTimes] = useState<MissionTimeWithOpportunities[]>([]);
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
      // Fusionner les temps de mission avec les opportunités groupées par valeur
      const mergedData = craData.missionTimes.map(mt => {
        const opportunities5 = craData.opportunities
          .filter(opp => opp.mission_id === mt.mission_id && opp.opportunity_value === 5)
          .map(opp => opp.opportunity_name)
          .join('\n');
        
        const opportunities10 = craData.opportunities
          .filter(opp => opp.mission_id === mt.mission_id && opp.opportunity_value === 10)
          .map(opp => opp.opportunity_name)
          .join('\n');
        
        const opportunities20 = craData.opportunities
          .filter(opp => opp.mission_id === mt.mission_id && opp.opportunity_value === 20)
          .map(opp => opp.opportunity_name)
          .join('\n');

        return {
          ...mt,
          opportunities_5: opportunities5,
          opportunities_10: opportunities10,
          opportunities_20: opportunities20,
          activity: mt.mission_comment || ''
        };
      });
      setMissionTimes(mergedData);
    } else if (craData?.missionTimes) {
      setMissionTimes(craData.missionTimes.map(mt => ({ 
        ...mt, 
        opportunities_5: '',
        opportunities_10: '',
        opportunities_20: '',
        activity: mt.mission_comment || ''
      })));
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

  const handleAddMissionTime = () => {
    if (readOnly) return;
    const now = new Date();
    setMissionTimes([...missionTimes, {
      id: new Date().getTime().toString(),
      report_id: '',
      mission_id: missions?.[0]?.id || '',
      time_percentage: 0,
      mission_comment: '',
      opportunities_5: '',
      opportunities_10: '',
      opportunities_20: '',
      activity: '',
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

    // Préparer les opportunités à partir des champs texte
    const allOpportunities: any[] = [];
    
    missionTimes.forEach(mt => {
      // Opportunités 5%
      if (mt.opportunities_5 && mt.opportunities_5.trim()) {
        const opportunities5 = mt.opportunities_5.split('\n').map(name => name.trim()).filter(name => name);
        opportunities5.forEach(name => {
          allOpportunities.push({
            mission_id: mt.mission_id,
            opportunity_name: name,
            opportunity_value: 5
          });
        });
      }
      
      // Opportunités 10%
      if (mt.opportunities_10 && mt.opportunities_10.trim()) {
        const opportunities10 = mt.opportunities_10.split('\n').map(name => name.trim()).filter(name => name);
        opportunities10.forEach(name => {
          allOpportunities.push({
            mission_id: mt.mission_id,
            opportunity_name: name,
            opportunity_value: 10
          });
        });
      }
      
      // Opportunités 20%
      if (mt.opportunities_20 && mt.opportunities_20.trim()) {
        const opportunities20 = mt.opportunities_20.split('\n').map(name => name.trim()).filter(name => name);
        opportunities20.forEach(name => {
          allOpportunities.push({
            mission_id: mt.mission_id,
            opportunity_name: name,
            opportunity_value: 20
          });
        });
      }
    });

    const craData = {
      report_date: formattedDate,
      mission_times: missionTimes.map(mt => ({
        mission_id: mt.mission_id,
        time_percentage: mt.time_percentage,
        mission_comment: mt.activity
      })),
      opportunities: allOpportunities,
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
          <CardTitle>Compte Rendu d'Activité</CardTitle>
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
                <TableHead className="bg-blue-500 text-white">Mission</TableHead>
                <TableHead className="text-center bg-blue-500 text-white">Temps %</TableHead>
                <TableHead className="text-center bg-blue-500 text-white">5%</TableHead>
                <TableHead className="text-center bg-blue-500 text-white">10%</TableHead>
                <TableHead className="text-center bg-blue-500 text-white">20%</TableHead>
                <TableHead className="text-center bg-blue-500 text-white">Activité</TableHead>
                {!readOnly && <TableHead className="text-center bg-blue-500 text-white"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {missionTimes.map((missionTime, index) => {
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
                            {mission.name}
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
                        className="w-16 text-center"
                        readOnly={readOnly}
                        disabled={readOnly}
                        placeholder="%"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Textarea
                        value={missionTime.opportunities_5 || ''}
                        onChange={(e) => !readOnly && handleMissionTimeChange(index, 'opportunities_5', e.target.value)}
                        placeholder="Noms des projets (un par ligne)"
                        readOnly={readOnly}
                        disabled={readOnly}
                        className="text-sm min-h-[60px] resize-none"
                        rows={3}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Textarea
                        value={missionTime.opportunities_10 || ''}
                        onChange={(e) => !readOnly && handleMissionTimeChange(index, 'opportunities_10', e.target.value)}
                        placeholder="Noms des projets (un par ligne)"
                        readOnly={readOnly}
                        disabled={readOnly}
                        className="text-sm min-h-[60px] resize-none"
                        rows={3}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Textarea
                        value={missionTime.opportunities_20 || ''}
                        onChange={(e) => !readOnly && handleMissionTimeChange(index, 'opportunities_20', e.target.value)}
                        placeholder="Noms des projets (un par ligne)"
                        readOnly={readOnly}
                        disabled={readOnly}
                        className="text-sm min-h-[60px] resize-none"
                        rows={3}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Textarea
                        value={missionTime.activity || ''}
                        onChange={(e) => !readOnly && handleMissionTimeChange(index, 'activity', e.target.value)}
                        placeholder="Activité..."
                        readOnly={readOnly}
                        disabled={readOnly}
                        className="text-sm min-h-[60px] resize-none"
                        rows={3}
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
              Ajouter
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
            className="min-w-32 bg-purple-600 hover:bg-purple-700"
          >
            {saveMutation.isPending ? (
              "Sauvegarde..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder le CRA
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
