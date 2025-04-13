
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Control } from "react-hook-form";
import { MissionFormValues } from "@/types/types";

interface DateFieldProps {
  control: Control<MissionFormValues>;
  name: "startDate" | "endDate";
  label: string;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date | null;
}

export function DateField({ 
  control, 
  name, 
  label, 
  placeholder = "Sélectionner une date",
  disabled = false, 
  minDate 
}: DateFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  {field.value ? (
                    format(field.value, "d MMMM yyyy", { locale: fr })
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value || undefined}
                onSelect={field.onChange}
                disabled={(date) => {
                  if (date < new Date("1900-01-01")) {
                    return true;
                  }
                  
                  if (minDate && date < minDate) {
                    return true;
                  }
                  
                  return disabled;
                }}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
