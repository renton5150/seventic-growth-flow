
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { craService } from "@/services/cra/craService";
import { supabase } from "@/integrations/supabase/client";

interface CRAFormProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

interface Mission {
  id: string;
  name: string;
  client: string;
}

interface MissionTime {
  mission_id: string;
  time_percentage: number;
  mission_comment: string;
}

interface Opportunity {
  mission_id: string;
  opportunity_name: string;
  opportunity_value: 5 | 10 | 20;
}

export const CRAForm: React.FC<CRAFormProps> = ({ selectedDate, onDateChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [missionTimes, setMissionTimes] = useState<MissionTime[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Récupérer les missions disponibles
  const { data: missions = [] } = useQuery({
    queryKey: ['missions-for-cra'],
    queryFn: async (): Promise<Mission[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('missions')
        .select('id, name, client, sdr_id')
        .order('name');

      // Filtrer selon le rôle
      if (user.role === 'sdr') {
        query = query.eq('sdr_id', user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erreur lors du chargement des missions:', error);
        return [];
      }

      return data?.filter(mission => mission.id && mission.id.trim() !== '') || [];
    },
    enabled: !!user
  });

  // Récupérer le CRA existant pour la date sélectionnée
  const { data: existingCRA, isLoading } = useQuery({
    queryKey: ['cra', dateString, user?.id],
    queryFn: () => craService.getCRAByDate(dateString),
    enabled: !!user && !!dateString,
    refetchOnWindowFocus: false
  });

  // Charger les données existantes quand elles sont disponibles
  useEffect(() => {
    if (existingCRA) {
      console.log("CRA existant trouvé:", existingCRA);
      
      if (existingCRA.missionTimes) {
        setMissionTimes(existingCRA.missionTimes.map(mt => ({
          mission_id: mt.mission_id,
          time_percentage: mt.time_percentage,
          mission_comment: mt.mission_comment || ""
        })));
      }

      if (existingCRA.opportunities) {
        setOpportunities(existingCRA.opportunities.map(opp => ({
          mission_id: opp.mission_id,
          opportunity_name: opp.opportunity_name,
          opportunity_value: opp.opportunity_value
        })));
      }

      if (existingCRA.report) {
        setComments(existingCRA.report.comments || "");
      }
    } else {
      // Réinitialiser le formulaire pour une nouvelle date
      setMissionTimes([]);
      setOpportunities([]);
      setComments("");
    }
  }, [existingCRA]);

  const mutation = useMutation({
    mutationFn: craService.createOrUpdateCRA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cra'] });
      toast.success("CRA sauvegardé avec succès");
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde du CRA");
      setIsSubmitting(false);
    }
  });

  const handleAddMissionTime = () => {
    if (missions.length > 0) {
      setMissionTimes([...missionTimes, {
        mission_id: missions[0].id,
        time_percentage: 0,
        mission_comment: ""
      }]);
    }
  };

  const handleRemoveMissionTime = (index: number) => {
    setMissionTimes(missionTimes.filter((_, i) => i !== index));
  };

  const handleAddOpportunity = () => {
    if (missions.length > 0) {
      setOpportunities([...opportunities, {
        mission_id: missions[0].id,
        opportunity_name: "",
        opportunity_value: 5
      }]);
    }
  };

  const handleRemoveOpportunity = (index: number) => {
    setOpportunities(opportunities.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);

    const totalPercentage = missionTimes.reduce((sum, mt) => sum + (mt.time_percentage || 0), 0);

    if (totalPercentage > 100) {
      toast.error("Le total des pourcentages ne peut pas dépasser 100%");
      setIsSubmitting(false);
      return;
    }

    const requestData = {
      report_date: dateString,
      mission_times: missionTimes.filter(mt => mt.mission_id && mt.time_percentage > 0),
      opportunities: opportunities.filter(opp => opp.mission_id && opp.opportunity_name.trim()),
      comments: comments.trim()
    };

    console.log("Données à sauvegarder:", requestData);
    mutation.mutate(requestData);
  };

  const totalPercentage = missionTimes.reduce((sum, mt) => sum + (mt.time_percentage || 0), 0);
  const getMissionName = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    return mission ? (mission.client || mission.name) : "Mission inconnue";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Chargement du CRA...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sélection de date */}
      <div>
        <Label htmlFor="date">Date du CRA</Label>
        <Input
          id="date"
          type="date"
          value={dateString}
          onChange={(e) => onDateChange(new Date(e.target.value))}
          className="max-w-xs"
        />
      </div>

      {/* Temps par mission */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Répartition du temps par mission</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMissionTime}
            disabled={missions.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {missionTimes.map((missionTime, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-4">
                <Label>Mission</Label>
                <Select
                  value={missionTime.mission_id}
                  onValueChange={(value) => {
                    const newMissionTimes = [...missionTimes];
                    newMissionTimes[index].mission_id = value;
                    setMissionTimes(newMissionTimes);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une mission" />
                  </SelectTrigger>
                  <SelectContent>
                    {missions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.client || mission.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label>Temps (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={missionTime.time_percentage || ""}
                  onChange={(e) => {
                    const newMissionTimes = [...missionTimes];
                    newMissionTimes[index].time_percentage = parseInt(e.target.value) || 0;
                    setMissionTimes(newMissionTimes);
                  }}
                />
              </div>
              
              <div className="col-span-5">
                <Label>Commentaire</Label>
                <Input
                  value={missionTime.mission_comment}
                  onChange={(e) => {
                    const newMissionTimes = [...missionTimes];
                    newMissionTimes[index].mission_comment = e.target.value;
                    setMissionTimes(newMissionTimes);
                  }}
                  placeholder="Activités réalisées..."
                />
              </div>
              
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMissionTime(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <div className="text-right">
            <span className={`text-sm ${totalPercentage > 100 ? 'text-red-600' : totalPercentage === 100 ? 'text-green-600' : 'text-gray-600'}`}>
              Total : {totalPercentage}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Opportunités */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Opportunités identifiées</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOpportunity}
            disabled={missions.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {opportunities.map((opportunity, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-4">
                <Label>Mission</Label>
                <Select
                  value={opportunity.mission_id}
                  onValueChange={(value) => {
                    const newOpportunities = [...opportunities];
                    newOpportunities[index].mission_id = value;
                    setOpportunities(newOpportunities);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une mission" />
                  </SelectTrigger>
                  <SelectContent>
                    {missions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.client || mission.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-4">
                <Label>Nom de l'opportunité</Label>
                <Input
                  value={opportunity.opportunity_name}
                  onChange={(e) => {
                    const newOpportunities = [...opportunities];
                    newOpportunities[index].opportunity_name = e.target.value;
                    setOpportunities(newOpportunities);
                  }}
                  placeholder="Nom de l'opportunité..."
                />
              </div>
              
              <div className="col-span-3">
                <Label>Valeur (K€)</Label>
                <Select
                  value={opportunity.opportunity_value.toString()}
                  onValueChange={(value) => {
                    const newOpportunities = [...opportunities];
                    newOpportunities[index].opportunity_value = parseInt(value) as 5 | 10 | 20;
                    setOpportunities(newOpportunities);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 K€</SelectItem>
                    <SelectItem value="10">10 K€</SelectItem>
                    <SelectItem value="20">20 K€</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveOpportunity(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Commentaires */}
      <div>
        <Label htmlFor="comments">Commentaires généraux</Label>
        <Textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Commentaires sur la journée, difficultés rencontrées, points d'amélioration..."
          rows={4}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || totalPercentage > 100}
          className="bg-seventic-500 hover:bg-seventic-600"
        >
          {isSubmitting ? "Sauvegarde..." : "Sauvegarder le CRA"}
        </Button>
      </div>
    </form>
  );
};
