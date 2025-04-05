
import { Control } from "react-hook-form";
import { Upload } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/requests/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface BlacklistSectionProps {
  control: Control<any>;
  blacklistAccountsTab: string;
  setBlacklistAccountsTab: (tab: string) => void;
  blacklistEmailsTab: string;
  setBlacklistEmailsTab: (tab: string) => void;
  handleFileUpload: (field: string, files: FileList | null) => void;
}

export const BlacklistSection = ({ 
  control, 
  blacklistAccountsTab,
  setBlacklistAccountsTab,
  blacklistEmailsTab,
  setBlacklistEmailsTab,
  handleFileUpload 
}: BlacklistSectionProps) => {
  return (
    <Card className="border-t-4 border-t-seventic-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Black liste</h3>

        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium mb-2">Comptes</h4>
            <Tabs value={blacklistAccountsTab} onValueChange={setBlacklistAccountsTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Fichier</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="pt-4">
                <FormField
                  control={control}
                  name="blacklistAccountsFileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUploader
                          icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                          title="Importer votre liste de comptes à exclure"
                          description="Formats acceptés : XLS, XLSX, CSV"
                          value={field.value}
                          onChange={(files) => handleFileUpload("blacklistAccountsFileUrl", files)}
                          accept=".xls,.xlsx,.csv"
                          maxSize={10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="notes" className="pt-4">
                <FormField
                  control={control}
                  name="blacklistAccountsNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Précisez les comptes à exclure" 
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
          </div>

          <div>
            <h4 className="text-md font-medium mb-2">Emails</h4>
            <Tabs value={blacklistEmailsTab} onValueChange={setBlacklistEmailsTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Fichier</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="pt-4">
                <FormField
                  control={control}
                  name="blacklistEmailsFileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUploader
                          icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                          title="Importer votre liste d'emails à exclure"
                          description="Formats acceptés : XLS, XLSX, CSV"
                          value={field.value}
                          onChange={(files) => handleFileUpload("blacklistEmailsFileUrl", files)}
                          accept=".xls,.xlsx,.csv"
                          maxSize={10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="notes" className="pt-4">
                <FormField
                  control={control}
                  name="blacklistEmailsNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Précisez les emails à exclure" 
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
