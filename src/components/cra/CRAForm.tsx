import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isWeekend, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  opportunities_5: string;
  opportunities_10: string;
  opportunities_20: string;
  comment: string;
}

// Fonction pour obtenir le prochain jour ouvré
const getNextWorkingDay = () => {
  const today = new Date();
  
  // Si c'est un jour ouvré (lundi à vendredi), retourner aujourd'hui
  if (!isWeekend(today)) {
    return today;
  }
  
  // Sinon, trouver le prochain lundi
  const nextMonday = new Date(today);
  const daysUntilMonday = (8 - today.getDay()) % 7;
  nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
  
  return nextMonday;
};

export const CRAForm: React.FC<CRAFormProps> = ({ selectedDate, onDateChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [craEntries, setCraEntries] = useState<CRAEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser avec un jour ouvré
  useEffect(() => {
    if (isWeekend(selectedDate)) {
      const nextWorkingDay = getNextWorkingDay();
      onDateChange(nextWorkingDay);
    }
  }, []);

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
          opportunities_5: opportunities.filter(opp => opp.opportunity_value === 5).map(opp => opp.opportunity_name).join(', '),
          opportunities_10: opportunities.filter(opp => opp.opportunity_value === 10).map(opp => opp.opportunity_name).join(', '),
          opportunities_20: opportunities.filter(opp => opp.opportunity_value === 20).map(opp => opp.opportunity_name).join(', '),
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
        opportunities_5: "",
        opportunities_10: "",
        opportunities_20: "",
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
      
      // Projets 5%
      if (entry.opportunities_5.trim()) {
        entry.opportunities_5.split(',').forEach((proj, i) => {
          if (proj.trim()) {
            opps.push({
              mission_id: entry.mission_id,
              opportunity_name: proj.trim(),
              opportunity_value: 5 as const
            });
          }
        });
      }
      
      // Projets 10%
      if (entry.opportunities_10.trim()) {
        entry.opportunities_10.split(',').forEach((proj, i) => {
          if (proj.trim()) {
            opps.push({
              mission_id: entry.mission_id,
              opportunity_name: proj.trim(),
              opportunity_value: 10 as const
            });
          }
        });
      }
      
      // Projets 20%
      if (entry.opportunities_20.trim()) {
        entry.opportunities_20.split(',').forEach((proj, i) => {
          if (proj.trim()) {
            opps.push({
              mission_id: entry.mission_id,
              opportunity_name: proj.trim(),
              opportunity_value: 20 as const
            });
          }
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    
    // Vérifier si c'est un weekend
    if (isWeekend(newDate)) {
      toast.error("Le CRA ne peut être saisi que durant les jours ouvrés (lundi à vendredi)");
      return;
    }
    
    onDateChange(newDate);
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
          onChange={handleDateChange}
          className="max-w-xs"
        />
        {isWeekend(selectedDate) && (
          <p className="text-sm text-red-600 mt-1">
            Le CRA ne peut être saisi que durant les jours ouvrés
          </p>
        )}
      </div>

      {/* Tableau CRA simplifié */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Compte Rendu d'Activité</CardTitle>
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
        <CardContent>
          {/* En-têtes du tableau */}
          <div className="grid grid-cols-12 gap-2 mb-2 p-2 bg-blue-600 text-white font-medium text-sm rounded">
            <div className="col-span-2">Mission</div>
            <div className="col-span-1 text-center">Temps %</div>
            <div className="col-span-2 text-center">5%</div>
            <div className="col-span-2 text-center">10%</div>
            <div className="col-span-2 text-center">20%</div>
            <div className="col-span-2 text-center">Activité</div>
            <div className="col-span-1"></div>
          </div>

          {/* Lignes du tableau */}
          {craEntries.map((entry, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-start p-2 border rounded mb-2">
              {/* Mission */}
              <div className="col-span-2">
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
                  className="h-8 text-center"
                />
              </div>
              
              {/* Projets 5% - Zone de texte plus grande */}
              <div className="col-span-2">
                <Textarea
                  value={entry.opportunities_5}
                  onChange={(e) => handleUpdateEntry(index, 'opportunities_5', e.target.value)}
                  placeholder="Noms des projets (un par ligne)"
                  className="min-h-[60px] text-xs resize-none"
                  rows={3}
                />
              </div>
              
              {/* Projets 10% - Zone de texte plus grande */}
              <div className="col-span-2">
                <Textarea
                  value={entry.opportunities_10}
                  onChange={(e) => handleUpdateEntry(index, 'opportunities_10', e.target.value)}
                  placeholder="Noms des projets (un par ligne)"
                  className="min-h-[60px] text-xs resize-none"
                  rows={3}
                />
              </div>
              
              {/* Projets 20% - Zone de texte plus grande */}
              <div className="col-span-2">
                <Textarea
                  value={entry.opportunities_20}
                  onChange={(e) => handleUpdateEntry(index, 'opportunities_20', e.target.value)}
                  placeholder="Noms des projets (un par ligne)"
                  className="min-h-[60px] text-xs resize-none"
                  rows={3}
                />
              </div>
              
              {/* Activité/Commentaire */}
              <div className="col-span-2">
                <Textarea
                  value={entry.comment}
                  onChange={(e) => handleUpdateEntry(index, 'comment', e.target.value)}
                  placeholder="Activité..."
                  className="min-h-[60px] text-xs resize-none"
                  rows={3}
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
          
          <div className="text-right mt-4">
            <span className={`text-sm font-medium ${totalPercentage > 100 ? 'text-red-600' : totalPercentage === 100 ? 'text-green-600' : 'text-gray-600'}`}>
              Total : {totalPercentage}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || totalPercentage > 100 || isWeekend(selectedDate)}
          className="bg-seventic-500 hover:bg-seventic-600"
        >
          {isSubmitting ? "Sauvegarde..." : "Sauvegarder le CRA"}
        </Button>
      </div>
    </form>
  );
};
