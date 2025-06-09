
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface CRAEntry {
  mission_id: string;
  time_percentage: number;
  opportunities_20: number;
  opportunities_10: number;
  opportunities_5: number;
  comment: string;
}

export const CRAForm: React.FC<CRAFormProps> = ({ selectedDate, onDateChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [craEntries, setCraEntries] = useState<CRAEntry[]>([]);
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

  // Charger les données existantes
  useEffect(() => {
    if (existingCRA && existingCRA.missionTimes) {
      const entries = existingCRA.missionTimes.map(mt => {
        const opportunities = existingCRA.opportunities?.filter(opp => opp.mission_id === mt.mission_id) || [];
        
        return {
          mission_id: mt.mission_id,
          time_percentage: mt.time_percentage,
          opportunities_20: opportunities.filter(opp => opp.opportunity_value === 20).length,
          opportunities_10: opportunities.filter(opp => opp.opportunity_value === 10).length,
          opportunities_5: opportunities.filter(opp => opp.opportunity_value === 5).length,
          comment: mt.mission_comment || ""
        };
      });
      setCraEntries(entries);
    } else {
      setCraEntries([]);
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

  const handleAddEntry = () => {
    if (missions.length > 0) {
      setCraEntries([...craEntries, {
        mission_id: missions[0].id,
        time_percentage: 0,
        opportunities_20: 0,
        opportunities_10: 0,
        opportunities_5: 0,
        comment: ""
      }]);
    }
  };

  const handleRemoveEntry = (index: number) => {
    setCraEntries(craEntries.filter((_, i) => i !== index));
  };

  const handleUpdateEntry = (index: number, field: keyof CRAEntry, value: any) => {
    const newEntries = [...craEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setCraEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);

    const totalPercentage = craEntries.reduce((sum, entry) => sum + (entry.time_percentage || 0), 0);

    if (totalPercentage > 100) {
      toast.error("Le total des pourcentages ne peut pas dépasser 100%");
      setIsSubmitting(false);
      return;
    }

    // Convertir les données pour l'API
    const missionTimes = craEntries
      .filter(entry => entry.mission_id && entry.time_percentage > 0)
      .map(entry => ({
        mission_id: entry.mission_id,
        time_percentage: entry.time_percentage,
        mission_comment: entry.comment
      }));

    const opportunities = craEntries.flatMap(entry => {
      const opps = [];
      for (let i = 0; i < entry.opportunities_20; i++) {
        opps.push({
          mission_id: entry.mission_id,
          opportunity_name: `Opportunité 20K€ ${i + 1}`,
          opportunity_value: 20 as const
        });
      }
      for (let i = 0; i < entry.opportunities_10; i++) {
        opps.push({
          mission_id: entry.mission_id,
          opportunity_name: `Opportunité 10K€ ${i + 1}`,
          opportunity_value: 10 as const
        });
      }
      for (let i = 0; i < entry.opportunities_5; i++) {
        opps.push({
          mission_id: entry.mission_id,
          opportunity_name: `Opportunité 5K€ ${i + 1}`,
          opportunity_value: 5 as const
        });
      }
      return opps;
    });

    const requestData = {
      report_date: dateString,
      mission_times: missionTimes,
      opportunities,
      comments: ""
    };

    console.log("Données à sauvegarder:", requestData);
    mutation.mutate(requestData);
  };

  const totalPercentage = craEntries.reduce((sum, entry) => sum + (entry.time_percentage || 0), 0);
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

      {/* Activités par mission - Interface simplifiée */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Activités par mission</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddEntry}
            disabled={missions.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {craEntries.map((entry, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
              {/* Mission */}
              <div className="col-span-3">
                <Select
                  value={entry.mission_id}
                  onValueChange={(value) => handleUpdateEntry(index, 'mission_id', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Mission" />
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
              
              {/* Temps (%) */}
              <div className="col-span-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={entry.time_percentage || ""}
                  onChange={(e) => handleUpdateEntry(index, 'time_percentage', parseInt(e.target.value) || 0)}
                  placeholder="%"
                  className="h-8"
                />
              </div>
              
              {/* Opportunités 20K€ */}
              <div className="col-span-1">
                <Input
                  type="number"
                  min="0"
                  value={entry.opportunities_20 || ""}
                  onChange={(e) => handleUpdateEntry(index, 'opportunities_20', parseInt(e.target.value) || 0)}
                  placeholder="20K"
                  className="h-8"
                />
              </div>
              
              {/* Opportunités 10K€ */}
              <div className="col-span-1">
                <Input
                  type="number"
                  min="0"
                  value={entry.opportunities_10 || ""}
                  onChange={(e) => handleUpdateEntry(index, 'opportunities_10', parseInt(e.target.value) || 0)}
                  placeholder="10K"
                  className="h-8"
                />
              </div>
              
              {/* Opportunités 5K€ */}
              <div className="col-span-1">
                <Input
                  type="number"
                  min="0"
                  value={entry.opportunities_5 || ""}
                  onChange={(e) => handleUpdateEntry(index, 'opportunities_5', parseInt(e.target.value) || 0)}
                  placeholder="5K"
                  className="h-8"
                />
              </div>
              
              {/* Commentaire */}
              <div className="col-span-4">
                <Input
                  value={entry.comment}
                  onChange={(e) => handleUpdateEntry(index, 'comment', e.target.value)}
                  placeholder="Commentaire..."
                  className="h-8"
                />
              </div>
              
              {/* Supprimer */}
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveEntry(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* En-têtes */}
          {craEntries.length > 0 && (
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium">
              <div className="col-span-3">Mission</div>
              <div className="col-span-1">Temps %</div>
              <div className="col-span-1">Opp 20K€</div>
              <div className="col-span-1">Opp 10K€</div>
              <div className="col-span-1">Opp 5K€</div>
              <div className="col-span-4">Commentaire</div>
              <div className="col-span-1"></div>
            </div>
          )}
          
          <div className="text-right">
            <span className={`text-sm ${totalPercentage > 100 ? 'text-red-600' : totalPercentage === 100 ? 'text-green-600' : 'text-gray-600'}`}>
              Total : {totalPercentage}%
            </span>
          </div>
        </CardContent>
      </Card>

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
