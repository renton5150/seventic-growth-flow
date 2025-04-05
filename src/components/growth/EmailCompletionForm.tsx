
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

const emailCompletionSchema = z.object({
  platform: z.enum(["Acelmail", "Bevo", "Postyman", "Direct IQ", "Mindbaz"]),
  sent: z.coerce.number().min(0),
  opened: z.coerce.number().min(0),
  clicked: z.coerce.number().min(0),
  bounced: z.coerce.number().min(0),
});

type EmailCompletionFormProps = {
  selectedRequest: Request;
  onComplete: () => void;
  onCancel: () => void;
};

export function EmailCompletionForm({ selectedRequest, onComplete, onCancel }: EmailCompletionFormProps) {
  const form = useForm<z.infer<typeof emailCompletionSchema>>({
    resolver: zodResolver(emailCompletionSchema),
    defaultValues: {
      platform: "Acelmail",
      sent: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
    },
  });
  
  const handleComplete = (data: z.infer<typeof emailCompletionSchema>) => {
    try {
      const completedRequest = updateRequestStatus(selectedRequest.id, "completed", {
        platform: data.platform,
        statistics: {
          sent: data.sent,
          opened: data.opened,
          clicked: data.clicked,
          bounced: data.bounced,
        },
      });
      
      if (completedRequest) {
        toast.success("La campagne d'email a été marquée comme terminée");
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
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plateforme utilisée</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une plateforme" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Acelmail">Acelmail</SelectItem>
                  <SelectItem value="Bevo">Bevo</SelectItem>
                  <SelectItem value="Postyman">Postyman</SelectItem>
                  <SelectItem value="Direct IQ">Direct IQ</SelectItem>
                  <SelectItem value="Mindbaz">Mindbaz</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre d'emails envoyés</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="opened"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre d'emails ouverts</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clicked"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de clics</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bounced"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de rebonds</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">Terminer la campagne</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
