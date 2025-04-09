
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getAllUsers } from "@/services/userService";
import { User } from "@/types/types";
import { useAuth } from "@/contexts/AuthContext";
import { missionSchema, MissionFormValues } from "./schema";

interface MissionFormProps {
  onSubmit: (values: MissionFormValues) => Promise<void>;
  defaultValues?: Partial<MissionFormValues>;
  isSubmitting: boolean;
  isAdmin?: boolean;
}

export const MissionForm = ({
  onSubmit,
  defaultValues,
  isSubmitting,
  isAdmin = false,
}: MissionFormProps) => {
  const { user } = useAuth();

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
  });

  const sdrUsers = users.filter((user: User) => user.role === 'sdr');

  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      name: "",
      description: "",
      sdrId: user?.id || "",
      startDate: new Date(),
      ...defaultValues
    },
  });

  return (
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
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date de démarrage</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
                <Textarea placeholder="Description de la mission" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création en cours..." : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
