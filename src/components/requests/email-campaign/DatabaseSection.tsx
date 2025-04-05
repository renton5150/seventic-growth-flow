
import { Control } from "react-hook-form";
import { Upload, Link } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/requests/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface DatabaseSectionProps {
  control: Control<any>;
  databaseTab: string;
  setDatabaseTab: (tab: string) => void;
  handleFileUpload: (field: string, files: FileList | null) => void;
}

export const DatabaseSection = ({ 
  control, 
  databaseTab, 
  setDatabaseTab, 
  handleFileUpload 
}: DatabaseSectionProps) => {
  return (
    <Card className="border-t-4 border-t-seventic-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Base de données</h3>
        
        <Tabs value={databaseTab} onValueChange={setDatabaseTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">Fichier</TabsTrigger>
            <TabsTrigger value="link">Lien web</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="pt-4">
            <FormField
              control={control}
              name="databaseFileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUploader
                      icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                      title="Importer votre base de données"
                      description="Formats acceptés : XLS, XLSX, CSV (Max 50 Mo)"
                      value={field.value}
                      onChange={(files) => handleFileUpload("databaseFileUrl", files)}
                      accept=".xls,.xlsx,.csv"
                      maxSize={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="link" className="pt-4">
            <FormField
              control={control}
              name="databaseWebLink"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Link className="h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="https://example.com/database" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="notes" className="pt-4">
            <FormField
              control={control}
              name="databaseNotes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="Donnez des indications sur la base à utiliser" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
