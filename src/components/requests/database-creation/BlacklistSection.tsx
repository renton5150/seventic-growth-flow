
import { Control } from "react-hook-form";
import { Upload } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FileUploader } from "@/components/requests/FileUploader";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface BlacklistSectionProps {
  control: Control<any>;
  blacklistAccountsTab: string;
  setBlacklistAccountsTab: (tab: string) => void;
  blacklistContactsTab: string;
  setBlacklistContactsTab: (tab: string) => void;
  handleFileUpload: (field: string, files: FileList | null) => void;
}

export const BlacklistSection = ({
  control,
  blacklistAccountsTab,
  setBlacklistAccountsTab,
  blacklistContactsTab,
  setBlacklistContactsTab,
  handleFileUpload
}: BlacklistSectionProps) => {
  return (
    <Card className="border-t-4 border-t-seventic-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Blacklist</h3>
        
        <div className="space-y-8">
          <div>
            <h4 className="font-medium mb-4">Comptes</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-sm mb-2">Fichier</h5>
                <FormField
                  control={control}
                  name="blacklistAccountsFileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUploader
                          icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                          title="Importer la liste d'entreprises à exclure"
                          description="Formats acceptés : XLS, XLSX, CSV (Max 50 Mo)"
                          value={field.value}
                          onChange={(files) => handleFileUpload("blacklistAccountsFileUrl", files)}
                          accept=".xls,.xlsx,.csv"
                          maxSize={50}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <h5 className="font-medium text-sm mb-2">Notes</h5>
                <FormField
                  control={control}
                  name="blacklistAccountsNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Listez les entreprises à exclure (une par ligne) ou donnez des instructions spécifiques" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Contacts</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-sm mb-2">Fichier</h5>
                <FormField
                  control={control}
                  name="blacklistContactsFileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUploader
                          icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                          title="Importer la liste de contacts à exclure"
                          description="Formats acceptés : XLS, XLSX, CSV (Max 50 Mo)"
                          value={field.value}
                          onChange={(files) => handleFileUpload("blacklistContactsFileUrl", files)}
                          accept=".xls,.xlsx,.csv"
                          maxSize={50}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <h5 className="font-medium text-sm mb-2">Notes</h5>
                <FormField
                  control={control}
                  name="blacklistContactsNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Listez les contacts à exclure (un par ligne) ou donnez des instructions spécifiques" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
