
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { MissionSelect } from "./MissionSelect";
import { Input } from "@/components/ui/input";

interface FormHeaderProps {
  form: UseFormReturn<any>;
  disabled?: boolean;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ form, disabled = false }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Nouvelle campagne email</CardTitle>
        <CardDescription>Renseignez les informations de base pour votre campagne</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="grid gap-4">
            <MissionSelect control={form.control} disabled={disabled} />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="title">
                    Titre de la campagne
                  </label>
                  <Input
                    id="title"
                    placeholder="Entrez un titre descriptif pour votre campagne"
                    {...field}
                    disabled={disabled}
                  />
                </div>
              )}
            />
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};
