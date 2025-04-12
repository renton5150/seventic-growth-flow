
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { createMission } from "@/services/missionService";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/user/userQueries";
import { Loader2 } from "lucide-react";

interface CreateMissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface MissionFormData {
  name: string;
  sdr_id?: string;
  description?: string;
}

export const CreateMissionDialog = ({ open, onOpenChange, onSuccess }: CreateMissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MissionFormData>();

  // Fetch SDRs for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-mission'],
    queryFn: () => getAllUsers(),
    enabled: open, // Only fetch when dialog is open
  });

  const sdrs = users.filter(user => user.role === 'sdr');

  const onSubmit = async (data: MissionFormData) => {
    setIsSubmitting(true);
    try {
      await createMission({
        name: data.name,
        client: "", // Sending empty string for client as it's removed from the form
        sdrId: data.sdr_id === 'unassigned' ? '' : (data.sdr_id || ''),
        description: data.description
      });
      
      toast.success('Mission créée avec succès');
      reset();
      onOpenChange(false);
      onSuccess(); // Refresh missions list
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error);
      toast.error('Erreur lors de la création de la mission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une mission</DialogTitle>
          <DialogDescription>
            Ajouter une nouvelle mission pour un SDR
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la mission</Label>
            <Input
              id="name"
              placeholder="Nom de la mission"
              {...register("name", { required: "Le nom de la mission est obligatoire" })}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sdr_id">Assigner à (SDR)</Label>
            <Select {...register("sdr_id")}>
              <SelectTrigger id="sdr_id">
                <SelectValue placeholder="Sélectionner un SDR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Non assigné</SelectItem>
                {sdrs.map((sdr) => (
                  <SelectItem key={sdr.id} value={sdr.id}>
                    {sdr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Description de la mission"
              {...register("description")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer la mission"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
