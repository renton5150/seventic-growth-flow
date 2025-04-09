import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createMission } from "@/services/missionService";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/userService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/types/types";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const missionSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom de la mission doit avoir au moins 2 caractères.",
  }),
  client: z.string().min(2, {
    message: "Le nom du client doit avoir au moins 2 caractères.",
  }),
  description: z.string().optional(),
  sdrId: z.string({
    required_error: "Veuillez sélectionner un SDR."
  }),
});

interface CreateMissionDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isAdmin?: boolean;
}

export const CreateMissionDialog = ({
  userId,
  open,
  onOpenChange,
  onSuccess,
  isAdmin = false,
}: CreateMissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
    enabled: open,
  });

  const sdrUsers = users.filter((user: User) => user.role === 'sdr');

  const form = useForm<z.infer<typeof missionSchema>>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      name: "",
      client: "",
      description: "",
      sdrId: user?.id || userId,
    },
  });

  const onSubmit = async (values: z.infer<typeof missionSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("Création de mission - données soumises:", values);
      console.log("Utilisateur actuel:", user);
      
      const result = await createMission({
        name: values.name,
        client: values.client, 
        description: values.description,
        sdrId: values.sdrId || user?.id || "",
      });
      
      if (result) {
        console.log("Mission créée avec succès:", result);
        onSuccess();
        onOpenChange(false);
        form.reset();
        toast.success("Mission créée avec succès");
      } else {
        console.error("Échec de création de la mission - résultat undefined");
        toast.error("Erreur lors de la création de la mission");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la mission:", error);
      toast.error("Erreur lors de la création de la mission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle mission</DialogTitle>
          <DialogDescription>
            Veuillez entrer les détails de la nouvelle mission.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la mission</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de la mission" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du client</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du client" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {(isAdmin || sdrUsers.length > 0) && (
              <FormField
                control={form.control}
                name="sdrId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SDR responsable</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || user?.id}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un SDR" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sdrUsers.length > 0 ? (
                          sdrUsers.map((sdrUser: User) => (
                            <SelectItem key={sdrUser.id} value={sdrUser.id}>
                              {sdrUser.name || sdrUser.email}
                            </SelectItem>
                          ))
                        ) : (
                          user && (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description de la mission" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création en cours..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
