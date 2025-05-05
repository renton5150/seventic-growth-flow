
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { formSchema } from "./schema";

type FormFields = z.infer<typeof formSchema>;

interface TextFieldProps {
  form: UseFormReturn<FormFields>;
  name: keyof FormFields;
  label: string;
  placeholder: string;
  description: string;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TextField({ 
  form, 
  name, 
  label, 
  placeholder, 
  description, 
  type = "text",
  onChange
}: TextFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input 
              placeholder={placeholder} 
              {...field} 
              type={type}
              onChange={onChange || (type === "number" 
                ? (e) => field.onChange(parseInt(e.target.value)) 
                : field.onChange)}
            />
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function StatusField({ form }: { form: UseFormReturn<FormFields> }) {
  return (
    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Statut</FormLabel>
          <FormControl>
            <select 
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...field}
            >
              <option value="inactive">Inactif</option>
              <option value="active">Actif</option>
              <option value="error">Erreur</option>
            </select>
          </FormControl>
          <FormDescription>
            Statut du compte (Actif pour le compte principal)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
