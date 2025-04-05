
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
import { createMission } from "@/services/missionService";
import { toast } from "sonner";

// Schema for mission form
const missionSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom de la mission doit avoir au moins 2 caractères.",
  }),
  client: z.string().min(2, {
    message: "Le nom du client doit avoir au moins 2 caractères.",
  }),
  description: z.string().optional(),
});

interface CreateMissionDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateMissionDialog = ({
  userId,
  open,
  onOpenChange,
  onSuccess,
}: CreateMissionDialogProps) => {
  const form = useForm<z.infer<typeof missionSchema>>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      name: "",
      client: "",
      description: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof missionSchema>) => {
    try {
      createMission({
        name: values.name,
        client: values.client, 
        description: values.description,
        sdrId: userId
      });
      
      onSuccess();
      onOpenChange(false);
      form.reset();
      toast.success("Mission créée avec succès");
    } catch (error) {
      console.error("Erreur lors de la création de la mission:", error);
      toast.error("Erreur lors de la création de la mission");
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Description de la mission" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
