
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Request } from "@/types/types";
import { updateRequestStatus } from "@/services/requestService";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

const databaseCompletionSchema = z.object({
  contactsCreated: z.coerce.number().min(0),
});

type DatabaseCompletionFormProps = {
  selectedRequest: Request;
  onComplete: () => void;
  onCancel: () => void;
};

export function DatabaseCompletionForm({ selectedRequest, onComplete, onCancel }: DatabaseCompletionFormProps) {
  const form = useForm<z.infer<typeof databaseCompletionSchema>>({
    resolver: zodResolver(databaseCompletionSchema),
    defaultValues: {
      contactsCreated: 0,
    },
  });
  
  const handleComplete = (data: z.infer<typeof databaseCompletionSchema>) => {
    try {
      const completedRequest = updateRequestStatus(selectedRequest.id, "completed", {
        contactsCreated: data.contactsCreated,
      });
      
      if (completedRequest) {
        toast.success("La demande de base de données a été marquée comme terminée");
        onComplete();
      }
    } catch (error) {
      console.error("Erreur lors de la complétion de la demande:", error);
      toast.error("Erreur lors de la complétion de la demande");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleComplete)} className="space-y-4">
        <FormField
          control={form.control}
          name="contactsCreated"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de contacts créés</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">Terminer la demande</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
