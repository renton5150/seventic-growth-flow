
import { useState } from "react";
import { Mission, User } from "@/types/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/userService";
import { assignSDRToMission } from "@/services/missionService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  sdrId: z.string({
    required_error: "Veuillez sélectionner un SDR",
  }),
});

interface AssignSDRDialogProps {
  mission: Mission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AssignSDRDialog = ({
  mission,
  open,
  onOpenChange,
  onSuccess,
}: AssignSDRDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sdrId: mission.sdrId || "",
    },
  });

  // Récupérer la liste des SDRs
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
    enabled: open,
  });
  
  // Filtrer pour ne garder que les SDRs
  const sdrUsers = users.filter((user: User) => user.role === 'sdr');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("Assignation d'un SDR à la mission:", mission.id, "SDR:", values.sdrId);
      
      await assignSDRToMission(mission.id, values.sdrId);
      
      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Erreur lors de l'assignation du SDR:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assigner un SDR à la mission</DialogTitle>
          <DialogDescription>
            Choisissez un SDR responsable pour la mission "{mission.name}"
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sdrId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SDR responsable</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un SDR" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sdrUsers.map((sdrUser: User) => (
                        <SelectItem key={sdrUser.id} value={sdrUser.id}>
                          {sdrUser.name || sdrUser.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Assignation en cours..." : "Assigner"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
