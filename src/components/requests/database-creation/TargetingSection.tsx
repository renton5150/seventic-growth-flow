
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface TargetingSectionProps {
  control: Control<any>;
}

export const TargetingSection = ({ control }: TargetingSectionProps) => {
  return (
    <Card className="border-t-4 border-t-seventic-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Ciblage</h3>
        
        <div className="space-y-6">
          <FormField
            control={control}
            name="jobTitles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intitulés de postes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ex: CEO, CTO, Marketing Director (un par ligne)" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="industries"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industries</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ex: IT, Finance, Healthcare (un par ligne)" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="companySize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taille d'entreprise</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ex: 50-200, 201-500, 501-1000 (un par ligne)" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="locations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localisation</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ex: France, Paris, Lyon (un par ligne)" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="otherCriteria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Autres critères</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Décrivez tout autre critère de ciblage spécifique" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
