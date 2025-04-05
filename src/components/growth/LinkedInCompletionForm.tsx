
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

const linkedinCompletionSchema = z.object({
  profilesScraped: z.coerce.number().min(0),
  resultFileUrl: z.string().optional(),
});

type LinkedInCompletionFormProps = {
  selectedRequest: Request;
  onComplete: () => void;
  onCancel: () => void;
};

export function LinkedInCompletionForm({ selectedRequest, onComplete, onCancel }: LinkedInCompletionFormProps) {
  const form = useForm<z.infer<typeof linkedinCompletionSchema>>({
    resolver: zodResolver(linkedinCompletionSchema),
    defaultValues: {
      profilesScraped: 0,
      resultFileUrl: "",
    },
  });
  
  const handleComplete = (data: z.infer<typeof linkedinCompletionSchema>) => {
    try {
      const completedRequest = updateRequestStatus(selectedRequest.id, "completed", {
        profilesScraped: data.profilesScraped,
        resultFileUrl: data.resultFileUrl,
      });
      
      if (completedRequest) {
        toast.success("La demande de scraping LinkedIn a été marquée comme terminée");
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
          name="profilesScraped"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de profils récupérés</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="resultFileUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL du fichier résultat (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="URL du fichier" {...field} />
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
